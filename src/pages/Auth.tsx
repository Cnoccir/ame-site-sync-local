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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    setLoading(true);
    setError('');

    try {
      // Temporary development bypass for tech@ame-inc.com
      if (email === 'tech@ame-inc.com' && password === 'demo123') {
        console.log('Using development bypass');

        // Create a mock session in localStorage to bypass ProtectedRoute
        localStorage.setItem('dev-auth', JSON.stringify({
          user: {
            email: 'tech@ame-inc.com',
            id: 'dev-tech-user',
            role: 'technician'
          },
          timestamp: Date.now()
        }));

        toast({
          title: "Development Login",
          description: "Logged in as tech user (demo mode)",
        });
        setLoading(false);
        console.log('Navigating to dashboard...');

        // Force a page refresh to reinitialize auth state
        window.location.href = '/';
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Route tech users to dashboard, others to projects
      if (email === 'tech@ame-inc.com') {
        navigate('/');
      } else {
        navigate('/projects');
      }
    } catch (error: any) {
      // If it's a fetch error, provide helpful message
      if (error.message === 'Failed to fetch') {
        setError('Unable to connect to authentication server. Please check your internet connection or try again later.');
      } else {
        setError(error.message);
      }

      toast({
        title: "Authentication Error",
        description: error.message === 'Failed to fetch' ? 'Connection failed - check network' : error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType: 'tech') => {
    const email = userType === 'tech' ? 'tech@ame-inc.com' : '';
    console.log('Quick login clicked:', { email, password: 'demo123' });
    setEmail(email);
    setPassword('demo123');

    // Auto-submit after setting credentials
    setTimeout(() => {
      const form = document.getElementById('auth-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
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
          <div className="text-xs text-center text-blue-600 bg-blue-50 p-2 rounded">
            Demo: Use "Technician" button or email: tech@ame-inc.com / password: demo123
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Access Button - Tech Only */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Access:</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('tech')}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                Technician
              </Button>
            </div>
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

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
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
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};