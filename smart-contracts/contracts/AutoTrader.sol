// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AutoTrader
 * @dev Main contract for automated trading on HashKey Chain
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPriceFeed {
    function getLatestPrice(string memory pair) external view returns (uint256);
}

contract AutoTrader is Ownable, ReentrancyGuard {
    // ==================== STRUCTS ====================

    struct Trade {
        uint256 id;
        string pair;
        uint256 entryPrice;
        uint256 tp1;
        uint256 tp2;
        uint256 tp3;
        uint256 sl;
        uint256 amount;
        uint256 timestamp;
        address trader;
        bool isOpen;
        uint256 exitPrice;
        uint256 profit;
        uint8 rsi;
        uint8 confirmations;
    }

    struct BotStats {
        uint256 totalTrades;
        uint256 winTrades;
        uint256 totalProfit;
        uint256 lastTradeTime;
        uint256 winRate;
    }

    struct CopyTrade {
        address copier;
        address original;
        uint256 amount;
        bool active;
        uint256 fee;
    }

    // ==================== STATE ====================

    mapping(uint256 => Trade) public trades;
    mapping(address => BotStats) public botStats;
    mapping(address => uint256) public balances;
    mapping(uint256 => CopyTrade) public copyTrades;

    uint256 public tradeCounter = 0;
    uint256 public copyTradeCounter = 0;
    uint256 public platformFee = 2; // 2%
    uint256 public totalVolume = 0;

    address public priceFeed;
    address public feeCollector;

    // ==================== EVENTS ====================

    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed trader,
        string pair,
        uint256 entryPrice,
        uint256 amount,
        uint8 confirmations
    );

    event TradeClosed(
        uint256 indexed tradeId,
        address indexed trader,
        uint256 exitPrice,
        int256 profit
    );

    event TakeProfitHit(
        uint256 indexed tradeId,
        uint256 level,
        uint256 price
    );

    event StopLossHit(
        uint256 indexed tradeId,
        uint256 price
    );

    event CopyTradeStarted(
        uint256 indexed copyId,
        address indexed copier,
        address indexed original,
        uint256 amount
    );

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    // ==================== MODIFIERS ====================

    modifier validTrade(uint256 _tradeId) {
        require(trades[_tradeId].id != 0, "Trade not found");
        require(trades[_tradeId].isOpen, "Trade closed");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor(address _priceFeed, address _feeCollector) {
        priceFeed = _priceFeed;
        feeCollector = _feeCollector;
    }

    // ==================== DEPOSIT/WITHDRAWAL ====================

    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(msg.sender, amount);
    }

    // ==================== TRADE EXECUTION ====================

    /**
     * @dev Execute a new trade
     */
    function executeTrade(
        string memory _pair,
        uint256 _entryPrice,
        uint256 _tp1,
        uint256 _tp2,
        uint256 _tp3,
        uint256 _sl,
        uint256 _amount,
        uint8 _rsi,
        uint8 _confirmations
    ) external nonReentrant returns (uint256) {
        require(_confirmations >= 4, "Need 4/4 confirmations");
        require(_amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        require(_tp1 > _entryPrice, "TP1 must be > entry");
        require(_sl < _entryPrice, "SL must be < entry");

        tradeCounter++;
        uint256 tradeId = tradeCounter;

        Trade storage trade = trades[tradeId];
        trade.id = tradeId;
        trade.pair = _pair;
        trade.entryPrice = _entryPrice;
        trade.tp1 = _tp1;
        trade.tp2 = _tp2;
        trade.tp3 = _tp3;
        trade.sl = _sl;
        trade.amount = _amount;
        trade.timestamp = block.timestamp;
        trade.trader = msg.sender;
        trade.isOpen = true;
        trade.rsi = _rsi;
        trade.confirmations = _confirmations;

        balances[msg.sender] -= _amount;
        totalVolume += _amount;

        // Update bot stats
        botStats[msg.sender].totalTrades++;
        botStats[msg.sender].lastTradeTime = block.timestamp;

        emit TradeExecuted(
            tradeId,
            msg.sender,
            _pair,
            _entryPrice,
            _amount,
            _confirmations
        );

        return tradeId;
    }

    /**
     * @dev Close a trade manually
     */
    function closeTrade(uint256 _tradeId, uint256 _exitPrice)
        external
        validTrade(_tradeId)
        nonReentrant
    {
        Trade storage trade = trades[_tradeId];
        require(trade.trader == msg.sender, "Not trade owner");

        trade.isOpen = false;
        trade.exitPrice = _exitPrice;

        // Calculate profit/loss
        int256 priceDiff = int256(_exitPrice) - int256(trade.entryPrice);
        int256 profit = (priceDiff * int256(trade.amount)) / int256(trade.entryPrice);

        // Apply platform fee
        uint256 fee = (uint256(profit > 0 ? profit : -profit) * platformFee) / 100;

        if (profit > 0) {
            trade.profit = uint256(profit);
            uint256 netProfit = trade.profit - fee;
            balances[msg.sender] += netProfit + trade.amount;
            balances[feeCollector] += fee;
            botStats[msg.sender].winTrades++;
            botStats[msg.sender].totalProfit += netProfit;
        } else {
            balances[msg.sender] += trade.amount - uint256(-profit) - fee;
            balances[feeCollector] += fee;
        }

        // Update win rate
        if (botStats[msg.sender].totalTrades > 0) {
            botStats[msg.sender].winRate =
                (botStats[msg.sender].winTrades * 100) /
                botStats[msg.sender].totalTrades;
        }

        emit TradeClosed(_tradeId, msg.sender, _exitPrice, profit);
    }

    /**
     * @dev Update take profit levels
     */
    function updateTakeProfit(
        uint256 _tradeId,
        uint256 _tp1,
        uint256 _tp2,
        uint256 _tp3
    ) external validTrade(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(trade.trader == msg.sender, "Not trade owner");

        trade.tp1 = _tp1;
        trade.tp2 = _tp2;
        trade.tp3 = _tp3;
    }

    /**
     * @dev Update stop loss
     */
    function updateStopLoss(uint256 _tradeId, uint256 _sl)
        external
        validTrade(_tradeId)
    {
        Trade storage trade = trades[_tradeId];
        require(trade.trader == msg.sender, "Not trade owner");
        require(_sl < trade.entryPrice, "SL must be < entry");

        trade.sl = _sl;
    }

    // ==================== COPY TRADING ====================

    /**
     * @dev Follow a trader for copy-trading
     */
    function startCopyTrade(
        address _originalTrader,
        uint256 _amount,
        uint256 _fee
    ) external returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        require(_fee <= 10, "Fee too high");

        copyTradeCounter++;
        uint256 copyId = copyTradeCounter;

        CopyTrade storage copy = copyTrades[copyId];
        copy.copier = msg.sender;
        copy.original = _originalTrader;
        copy.amount = _amount;
        copy.active = true;
        copy.fee = _fee;

        balances[msg.sender] -= _amount;

        emit CopyTradeStarted(copyId, msg.sender, _originalTrader, _amount);

        return copyId;
    }

    /**
     * @dev Stop copy-trading
     */
    function stopCopyTrade(uint256 _copyId) external nonReentrant {
        CopyTrade storage copy = copyTrades[_copyId];
        require(copy.copier == msg.sender, "Not copier");
        require(copy.active, "Already inactive");

        copy.active = false;
        
        // Refund funds
        uint256 refund = (copy.amount * 100) / 100; // Simplified
        balances[msg.sender] += refund;
    }

    // ==================== GETTERS ====================

    /**
     * @dev Get trade details
     */
    function getTrade(uint256 _tradeId)
        external
        view
        returns (Trade memory)
    {
        return trades[_tradeId];
    }

    /**
     * @dev Get bot statistics
     */
    function getBotStatistics(address _bot)
        external
        view
        returns (BotStats memory)
    {
        return botStats[_bot];
    }

    /**
     * @dev Get user balance
     */
    function getBalance(address _user) external view returns (uint256) {
        return balances[_user];
    }

    /**
     * @dev Get trade counter
     */
    function getTradeCount() external view returns (uint256) {
        return tradeCounter;
    }

    /**
     * @dev Get total platform volume
     */
    function getTotalVolume() external view returns (uint256) {
        return totalVolume;
    }

    // ==================== ADMIN ====================

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10, "Fee too high");
        platformFee = _fee;
    }

    /**
     * @dev Update price feed
     */
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
    }

    /**
     * @dev Update fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }
}
