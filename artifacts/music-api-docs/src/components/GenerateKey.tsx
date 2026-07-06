import { useState } from 'react';
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const UNLOCK_CODE = 'Blocker-X-Music';
const STORAGE_KEY = 'music-api-key-generated';
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export function GenerateKey() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alreadyUsed, setAlreadyUsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true',
  );

  const handleOpen = () => {
    setError('');
    setCode('');
    setRevealed(false);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (alreadyUsed) {
      setError('Esta key ya fue generada una vez en este navegador.');
      return;
    }
    if (code.trim() !== UNLOCK_CODE) {
      setError('Código incorrecto.');
      return;
    }
    if (!API_KEY) {
      setError('No hay una API Key configurada en el servidor. Contactá al administrador.');
      return;
    }
    setRevealed(true);
    setError('');
    localStorage.setItem(STORAGE_KEY, 'true');
    setAlreadyUsed(true);
  };

  const handleCopy = async () => {
    if (!API_KEY) return;
    await navigator.clipboard.writeText(API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button onClick={handleOpen} className="gap-2">
        <KeyRound className="w-4 h-4" />
        Generate Key
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar API Key</DialogTitle>
            <DialogDescription>
              {revealed
                ? 'Guardá esta key ahora — no se va a volver a mostrar.'
                : 'Ingresá el código de acceso para generar tu API Key.'}
            </DialogDescription>
          </DialogHeader>

          {!revealed ? (
            <div className="space-y-4">
              <Input
                placeholder="Código de acceso"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={alreadyUsed}
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
              )}
              {alreadyUsed && !error && (
                <p className="text-sm text-muted-foreground">
                  Ya generaste tu key desde este navegador. Si la perdiste, contactá al
                  administrador de la API.
                </p>
              )}
              <Button onClick={handleSubmit} disabled={alreadyUsed} className="w-full">
                Generar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                <code className="flex-1 text-sm font-mono text-primary break-all">
                  {API_KEY}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copiala y guardala en un lugar seguro (por ejemplo en tu archivo .env como{' '}
                <code className="text-primary">MUSIC_API_KEY</code>). No la vas a poder ver de
                nuevo desde acá.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
