"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deleteAiConfig,
  getAiConfig,
  getAiProviders,
  saveAiConfig,
  validateAiKey,
} from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";
import type { AiConfigResponse, AiProviderOption } from "@/lib/types";

export function AiSettingsPanel() {
  const [providers, setProviders] = useState<AiProviderOption[]>([]);
  const [config, setConfig] = useState<AiConfigResponse>(null);
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isValidating, startValidate] = useTransition();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());

    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("autotrader-auth-change", syncAuth);
    return () => window.removeEventListener("autotrader-auth-change", syncAuth);
  }, []);

  useEffect(() => {
    getAiProviders().then((providerList) => {
      setProviders(providerList);
      if (providerList.length > 0 && !selectedModel) {
        setSelectedModel(providerList[0].defaultModel);
      }
    });
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getAiConfig().then((existingConfig) => {
        if (existingConfig) {
          setConfig(existingConfig);
          setSelectedProvider(existingConfig.provider);
          setSelectedModel(existingConfig.model);
        }
      });
    }
  }, [loggedIn]);

  useEffect(() => {
    const providerDef = providers.find((p) => p.id === selectedProvider);
    if (providerDef) {
      setSelectedModel(providerDef.defaultModel);
    }
  }, [selectedProvider, providers]);

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  const handleSave = () => {
    startSave(async () => {
      setFeedback(null);
      setError(null);

      if (!apiKey.trim()) {
        setError("Please enter your API key.");
        return;
      }

      try {
        const saved = await saveAiConfig({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
          model: selectedModel,
        });
        setConfig(saved);
        setApiKey("");
        setFeedback("AI provider configured successfully. You can now run AI-powered analysis.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save configuration.");
      }
    });
  };

  const handleValidate = () => {
    startValidate(async () => {
      setFeedback(null);
      setError(null);

      const keyToTest = apiKey.trim();
      if (!keyToTest) {
        setError("Enter an API key first to validate.");
        return;
      }

      try {
        const result = await validateAiKey(selectedProvider, keyToTest);
        if (result.valid) {
          setFeedback(`Key is valid! Connected to ${result.model || selectedModel}.`);
        } else {
          setError("Key validation failed. Please check your key.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Validation failed.");
      }
    });
  };

  const handleRemove = () => {
    startSave(async () => {
      setFeedback(null);
      setError(null);
      try {
        await deleteAiConfig();
        setConfig(null);
        setFeedback("AI configuration removed.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove configuration.");
      }
    });
  };

  if (!loggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">AI Strategy Analyst</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
            Log in to configure your AI provider and unlock intelligent trade analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">AI Strategy Analyst</CardTitle>
          {config?.hasKey ? (
            <Badge tone="success">Connected</Badge>
          ) : (
            <Badge tone="warning">Not configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {config?.hasKey ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Current configuration</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Provider: <span className="font-medium text-[var(--foreground)]">{config.provider}</span>
                  {" · "}Model: <span className="font-medium text-[var(--foreground)]">{config.model}</span>
                  {" · "}Key: <span className="font-mono text-[var(--foreground)]">{config.apiKeyMasked}</span>
                </p>
              </div>
              <Button variant="secondary" onClick={handleRemove} disabled={isSaving}>
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {config?.hasKey ? "Update provider" : "Configure your AI provider"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Choose any LLM provider. Your key is encrypted at rest and never sent to our servers — only used for direct API calls to your chosen provider.
          </p>

          <div className="mt-4 grid gap-3">
            <label className="block text-sm text-[var(--muted)]">
              Provider
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.description}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-[var(--muted)]">
              Model
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
              >
                {currentProvider?.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-[var(--muted)]">
              API Key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config?.hasKey ? "Enter new key to update" : "sk-... or your provider key"}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
              />
            </label>

            <div className="flex gap-3">
              <Button
                className="flex-1 justify-center"
                onClick={handleValidate}
                variant="secondary"
                disabled={isValidating || isSaving || !apiKey.trim()}
              >
                {isValidating ? "Validating..." : "Test key"}
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={handleSave}
                disabled={isSaving || isValidating || !apiKey.trim()}
              >
                {isSaving ? "Saving..." : "Save configuration"}
              </Button>
            </div>
          </div>
        </div>

        {feedback ? <p className="text-sm text-[var(--success)]">{feedback}</p> : null}
        {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
