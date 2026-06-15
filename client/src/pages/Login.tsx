import { useState, type SubmitEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { InputField } from '@/components/InputField';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    login({ email, password });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-xl min-w-lg">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <InputField
                id="email"
                type="email"
                label="Email"
                value={email}
                setValue={setEmail}
              />

              <InputField
                id="email"
                type="password"
                label="Password"
                value={password}
                setValue={setPassword}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
