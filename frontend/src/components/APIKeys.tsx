import React, { useEffect, useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ShieldAlert,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { fetchAPIKeys, createAPIKey, revokeAPIKey } from '../api';
import { APIKey } from '../types';

export function APIKeys() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ name: string, key: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKeys = async () => {
    try {
      const data = await fetchAPIKeys();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Failed to load keys', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      const res = await createAPIKey(newKeyName, null);
      setNewlyCreatedKey({ name: newKeyName, key: res.key });
      toast.success(`API Key "${newKeyName}" created!`);
      setIsDialogOpen(false);
      setNewKeyName('');
      loadKeys();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create key');
    }
  };

  const handleRevokeKey = async (name: string) => {
    if (!name) {
      toast.error('Invalid key name');
      return;
    }
    try {
      await revokeAPIKey(name);
      toast.success('API Key revoked');
      loadKeys();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke key');
    }
  };

  const copyKey = (keyString: string) => {
    navigator.clipboard.writeText(keyString);
    toast.success('API Key copied to clipboard');
  };

  if (loading) return <div className="p-8 text-white">Loading keys...</div>;

  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">API Management</h1>
            <p className="text-zinc-400">Securely manage your platform access keys and set usage quotas.</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Create New Key
              </Button>
            </DialogTrigger>

            <DialogContent
              className="
                sm:max-w-md
                overflow-hidden
                rounded-3xl

                border border-white/10
                bg-[#0A0A0F]/95

                text-white
                backdrop-blur-2xl

                shadow-[0_25px_80px_rgba(0,0,0,0.65)]
                p-0
              "
            >
              <DialogHeader className="px-6 pt-6 space-y-2">
                <DialogTitle className="text-3xl font-bold tracking-tight text-white">
                  New API Access Key
                </DialogTitle>

                <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                  Generated keys are unique.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-6 space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.25em]
                      text-zinc-500
                    "
                  >
                    Key Name
                  </Label>

                  <Input
                    id="name"
                    placeholder="e.g. Mobile App Production"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="
                      h-14
                      rounded-2xl

                      border border-white/10
                      bg-black/40

                      px-5

                      text-white
                      placeholder:text-zinc-600

                      shadow-inner
                      shadow-black/30

                      transition-all duration-200

                      hover:border-white/15

                      focus:border-blue-500/40
                      focus:ring-2
                      focus:ring-blue-500/20
                    "
                  />
                </div>
              </div>

              <DialogFooter
                className="
                  border-t border-white/5

                  bg-white/[0.02]

                  px-6 py-5

                  flex-row gap-3
                "
              >
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="
                    flex-1
                    h-11

                    rounded-xl

                    border border-white/5
                    bg-white/[0.03]

                    text-zinc-300

                    hover:bg-white/[0.06]
                    hover:text-white
                  "
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleCreateKey}
                  className="
                    flex-1
                    h-11

                    rounded-xl

                    bg-gradient-to-b
                    from-blue-500
                    to-blue-600

                    text-white
                    font-semibold

                    shadow-lg
                    shadow-blue-950/40

                    hover:from-blue-400
                    hover:to-blue-500

                    transition-all duration-200
                  "
                >
                  Generate Access Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>





          <Dialog
            open={!!newlyCreatedKey}
            onOpenChange={(open) => !open && setNewlyCreatedKey(null)}
          >
            <DialogContent
              className="
                sm:max-w-md
                overflow-hidden
                rounded-3xl

                border border-white/10
                bg-[#0A0A0F]/95

                text-white
                backdrop-blur-2xl

                shadow-[0_25px_80px_rgba(0,0,0,0.65)]
                p-0
              "
            >
              <DialogHeader className="px-6 pt-6 space-y-2">
                <DialogTitle className="text-3xl font-bold tracking-tight text-white">
                  API Key Created
                </DialogTitle>

                <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                  Please copy your new API key now. You won't be able to see it again!
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-6">
                <div
                  className="
                    flex items-center justify-between gap-4

                    rounded-2xl

                    border border-cyan-500/10
                    bg-[#07090F]

                    p-5

                    shadow-inner
                    shadow-black/50

                    transition-all duration-200

                    hover:border-cyan-400/20
                  "
                >
                  <code
                    className="
                      flex-1
                      break-all

                      font-mono
                      text-[15px]
                      font-semibold
                      tracking-wide

                      text-[#00F5B0]
                    "
                  >
                    {newlyCreatedKey?.key}
                  </code>

                  <Button
                    variant="outline"
                    onClick={() => copyKey(newlyCreatedKey?.key || '')}
                    className="
                      shrink-0

                      h-11
                      rounded-xl

                      border border-white/10
                      bg-white/[0.03]

                      text-white

                      shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]

                      transition-all duration-300

                      hover:bg-blue-600/10
                      hover:border-blue-500/20
                      hover:text-blue-100
                      hover:shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]

                      active:scale-[0.98]
                    "
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Key
                  </Button>
                </div>
              </div>

              <DialogFooter
                className="
                  border-t border-white/5

                  bg-white/[0.02]

                  px-6 py-5
                "
              >
                <Button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="
                    flex-1
                    h-11

                    rounded-xl

                    bg-gradient-to-b
                    from-blue-500
                    to-blue-600

                    text-white
                    font-semibold

                    shadow-lg
                    shadow-blue-950/40

                    hover:from-blue-400
                    hover:to-blue-500

                    transition-all duration-200
                  "
                >
                  I have copied it
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <Table>
            <TableHeader className="border-b border-white/10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-6">Name</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Secret Key (Hash)</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Created / Last Used</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Usage</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.filter(k => k.is_active !== false).map((key) => (
                <TableRow key={key.id} className="border-white/5 hover:bg-white/[0.04] transition-all group border-b last:border-0">
                  <TableCell className="font-medium text-white py-4 pl-6">{key.name || `Key #${key.id}`}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span className="w-48 break-all">••••••••••••••••</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-xs">
                    <div>{key.created_at ? new Date(key.created_at).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-[10px] text-zinc-500">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never used'}</div>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-xs">
                    <div>{key.request_count || 0} reqs</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "uppercase text-[9px] font-bold",
                      key.is_active !== false
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {key.is_active !== false ? 'Active' : 'Revoked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      {key.is_active !== false && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="
                              h-8 w-8 p-0
                              text-zinc-500
                              hover:text-red-400
                            "
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent
                            className="
                            sm:max-w-md
                              overflow-hidden

                              rounded-3xl

                              border border-white/10
                              bg-[#0A0A0F]/95

                              text-white

                              backdrop-blur-2xl

                              shadow-[0_25px_80px_rgba(0,0,0,0.65)]

                              p-0
                          "
                          >
                            <AlertDialogHeader className="px-6 pt-6 space-y-2">
                              <AlertDialogTitle>
                                Revoke API Key?
                              </AlertDialogTitle>

                              <AlertDialogDescription className="text-zinc-400">
                                This action will permanently revoke
                                <span className="text-white font-medium">
                                  {" "} {key.name}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="border-t border-white/5

                                bg-white/[0.02]

                                px-6 py-5

                                flex-row gap-3">
                              <AlertDialogCancel
                                className="
                                flex-1
                                    h-11
                                    rounded-xl
                                    border border-white/5
                                    bg-white/[0.03]

                                    text-zinc-300

                                    hover:bg-white/[0.06]
                                    hover:text-white
                              "
                              >
                                Cancel
                              </AlertDialogCancel>

                              <AlertDialogAction
                                onClick={() => handleRevokeKey(key.name || '')}
                                className="
                                flex-1
                                h-11

                                rounded-xl

                                border border-red-500/20

                                bg-red-500/10

                                text-red-300
                                font-semibold

                                transition-all duration-200

                                hover:bg-red-500/20
                                hover:border-red-500/30
                                hover:text-red-200
                              "
                              >
                                Revoke Key
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {keys.filter(k => k.is_active !== false).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    No API keys found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
