import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";

export const AuthModal = ({ isOpen, onClose, login, register }) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Login successful!");
      onClose();
    } catch (err) {
      toast.error(err || "Login failed");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      toast.success("Registration successful!");
      onClose();
    } catch (err) {
      toast.error(err || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#EDEDED]">Welcome to Plutus Predict</DialogTitle>
          <DialogDescription className="text-[#888]">
            Login or create an account to access AI forecasting
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#0A0A0A] border border-[#1F1F1F]">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]"
                    data-testid="login-email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]"
                    data-testid="login-password"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
                data-testid="login-submit"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                  <Input
                    type="text"
                    placeholder="Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="pl-10 bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]"
                    data-testid="reg-name"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-10 bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]"
                    data-testid="reg-email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10 bg-[#0A0A0A] border-[#1F1F1F] text-[#EDEDED]"
                    data-testid="reg-password"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
                data-testid="reg-submit"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
