import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (createMode) {
        // Temporary create mode for dev accounts
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Account created successfully. Now you can login.",
        });
        setCreateMode(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        
        navigate('/projects');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (devEmail: string) => {
    setEmail(devEmail);
    setPassword('Ameinc4100');
  };

  const createDevAccounts = async () => {
    setLoading(true);
    const accounts = [
      { email: 'tech@ame-inc.com', password: 'Ameinc4100' },
      { email: 'admin@ame-inc.com', password: 'Ameinc4100' }
    ];

    for (const account of accounts) {
      try {
        const { error } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error && !error.message.includes('already registered')) {
          console.error(`Error creating ${account.email}:`, error);
        }
      } catch (err) {
        console.error(`Error creating ${account.email}:`, err);
      }
    }
    
    setLoading(false);
    toast({
      title: "Dev Accounts Created",
      description: "Development accounts are ready for use.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Sign In to AME
          </CardTitle>
          <p className="text-muted-foreground text-center">
            Enter your credentials to access the maintenance system
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Dev Account Setup */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={createDevAccounts}
              disabled={loading}
              className="w-full text-xs"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
              Create Dev Accounts (One-time setup)
            </Button>
          </div>

          {/* Dev Login Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Development Accounts (Click to auto-fill):</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDevLogin('tech@ame-inc.com')}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                Technician
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDevLogin('admin@ame-inc.com')}
                className="text-xs"
              >
                <Lock className="w-3 h-3 mr-1" />
                Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password for both accounts: <strong>Ameinc4100</strong>
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {createMode ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setCreateMode(!createMode)}
              className="text-xs text-primary hover:underline"
            >
              {createMode ? 'Back to Sign In' : 'Need to create accounts?'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};