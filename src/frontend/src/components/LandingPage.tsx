import { Button } from "@/components/ui/button";
import { HardDrive, Lock, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background grid-lines flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight text-foreground">
            Vault
          </span>
        </div>
        <Button
          data-ocid="auth.login_button"
          onClick={() => login()}
          disabled={isLoggingIn}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600"
        >
          {isLoggingIn ? "Connecting..." : "Sign In"}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-display mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-end encrypted on the Internet Computer</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-800 leading-[1.05] tracking-tight text-foreground">
            Your files, <span className="gold-text">absolutely</span> private.
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Store, organize, and access your files with cryptographic security.
            No servers, no middlemen — just you and your vault.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              data-ocid="auth.login_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600 text-base px-8 h-12"
            >
              {isLoggingIn ? "Connecting..." : "Open Your Vault"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
        >
          {[
            {
              icon: <Lock className="w-5 h-5 text-primary" />,
              title: "Private by default",
              desc: "Your files are accessible only to you via Internet Identity.",
            },
            {
              icon: <HardDrive className="w-5 h-5 text-primary" />,
              title: "Decentralized storage",
              desc: "Files stored on-chain, no central server to breach.",
            },
            {
              icon: <Zap className="w-5 h-5 text-primary" />,
              title: "Instant access",
              desc: "Stream and download your files from anywhere, instantly.",
            },
          ].map((f) => (
            <div key={f.title} className="vault-card rounded-lg p-5 space-y-2">
              <div className="p-2 rounded bg-primary/10 w-fit">{f.icon}</div>
              <h3 className="font-display font-600 text-sm text-foreground">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-border/50 text-center">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
