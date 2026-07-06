import { useState } from 'react';
import { KeyRound, Copy, Check, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function GenerateKey() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ key: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    setError('');
    setPassword('');
    setResult(null);
    setOpen(true);
  };

  const handleGenerate = async () => {
    if (!password.trim()) {
      setError('Enter the access password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate key. Try again.');
        return;
      }
      setResult({ key: data.key, expiresAt: data.expiresAt });
    } catch {
      setError('Connection error. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryDate = result
    ? new Date(result.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <Button onClick={handleOpen} className="gap-2">
        <KeyRound className="w-4 h-4" />
        Generate API Key
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              {result
                ? 'Your key is ready. Copy it now — it cannot be retrieved again.'
                : 'Enter the access password to generate a unique API key.'}
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                <code className="flex-1 text-sm font-mono text-primary break-all select-all">
                  {result.key}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopy} title="Copy to clipboard">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-start gap-2 text-xs rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="text-muted-foreground">
                  <span className="text-amber-400 font-medium">Expires {expiryDate}.</span>{' '}
                  Save this key in your <code className="text-primary">.env</code> as{' '}
                  <code className="text-primary">MUSIC_API_KEY</code>. When it expires, return
                  here to generate a new one.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
