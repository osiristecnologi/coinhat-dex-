import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useWeb3, NETWORKS } from "@/contexts/Web3Context";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ArrowDownUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SwapService } from "@/lib/swapService";

type SwapStatus = "idle" | "approving" | "swapping" | "success" | "error";

const COMMON_TOKENS = {
  ethereum: {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  bsc: {
    WBNB: "0xbb4CdB9CBd36B01bD1cbaB6f2DF0c2d5d0e9e5Ef",
    USDC: "0x8AC76a51cc950d9822D68b83FE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  },
};

export default function SwapPage() {
  const { t } = useI18n();
  const { provider, account, network, chainId, isConnected, connectWallet } = useWeb3();

  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [swapStatus, setSwapStatus] = useState<SwapStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [loading, setLoading] = useState(false);

  const networkConfig = network ? NETWORKS[network] : null;
  const commonTokens = network ? (COMMON_TOKENS[network] as Record<string, string>) : {};

  const handleSwap = async () => {
    if (!provider || !account || !networkConfig) {
      toast.error("Wallet not connected");
      return;
    }

    if (!fromToken || !toToken || !fromAmount) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setSwapStatus("approving");

      const swapService = new SwapService(provider, account);

      // Check allowance
      const allowance = await swapService.checkAllowance(fromToken, networkConfig.routerAddress);
      if (parseFloat(allowance) < parseFloat(fromAmount)) {
        // Approve
        const approvalResult = await swapService.approveToken(fromToken, networkConfig.routerAddress, fromAmount);
        if (!approvalResult.success) {
          throw new Error("Approval failed");
        }
        toast.success("Token approved!");
      }

      setSwapStatus("swapping");

      // Execute swap
      const path = [fromToken, toToken];
      const amountOutMin = (parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString();

      const swapResult = await swapService.swapTokensForTokens(networkConfig.routerAddress, fromAmount, amountOutMin, path);

      if (swapResult.success) {
        setSwapStatus("success");
        setTxHash(swapResult.hash);
        toast.success("Swap successful!");
        setFromAmount("");
        setToAmount("");
      } else {
        throw new Error("Swap transaction failed");
      }
    } catch (error) {
      setSwapStatus("error");
      const msg = error instanceof Error ? error.message : "Swap failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuote = async () => {
    if (!provider || !networkConfig || !fromToken || !toToken || !fromAmount) {
      return;
    }

    try {
      setLoading(true);
      const swapService = new SwapService(provider, account!);
      const amounts = await swapService.getAmountsOut(networkConfig.routerAddress, fromAmount, [fromToken, toToken]);
      setToAmount(amounts[amounts.length - 1] || "0");
    } catch (error) {
      toast.error("Failed to get quote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && fromToken && toToken) {
        handleGetQuote();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md p-6 bg-card border-border">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-500" />
              <h2 className="text-xl font-bold text-foreground">{t("connectWallet")}</h2>
              <p className="text-sm text-muted-foreground">Please connect your wallet to use the swap feature</p>
              <Button onClick={connectWallet} className="w-full" style={{ background: "var(--coinhat-yellow)", color: "#0a0a0f" }}>
                {t("connectWallet")}
              </Button>
            </div>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-6 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          {/* Network info */}
          <Card className="p-3 bg-card border-border">
            <div className="text-xs text-muted-foreground">
              Network: <span className="font-semibold text-foreground">{network?.toUpperCase()}</span>
            </div>
          </Card>

          {/* Swap card */}
          <Card className="p-6 bg-card border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground">Swap</h2>

            {/* From token */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">From</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTokenSelector("from")}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Select
                </Button>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <Button
                size="icon"
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFromToken(toToken);
                  setToToken(fromToken);
                  setFromAmount(toAmount);
                  setToAmount(fromAmount);
                }}
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </div>

            {/* To token */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">To</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTokenSelector("to")}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Select
                </Button>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                disabled
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Slippage */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Slippage Tolerance (%)</label>
              <Input
                type="number"
                placeholder="0.5"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                min="0"
                max="50"
                step="0.1"
              />
            </div>

            {/* Swap button */}
            <Button
              onClick={handleSwap}
              disabled={loading || !fromToken || !toToken || !fromAmount}
              className="w-full font-semibold"
              style={!loading ? { background: "var(--coinhat-yellow)", color: "#0a0a0f" } : {}}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {swapStatus === "approving" ? "Approving..." : "Swapping..."}
                </>
              ) : (
                "Swap"
              )}
            </Button>
          </Card>

          {/* Status messages */}
          {swapStatus === "success" && (
            <Card className="p-4 bg-green-500/10 border-green-500/30">
              <div className="flex gap-2 items-start">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-500">Swap successful!</p>
                  <a
                    href={`https://${network === "ethereum" ? "etherscan.io" : "bscscan.com"}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 underline"
                  >
                    View on explorer
                  </a>
                </div>
              </div>
            </Card>
          )}

          {swapStatus === "error" && (
            <Card className="p-4 bg-red-500/10 border-red-500/30">
              <div className="flex gap-2 items-start">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-500">Swap failed. Please try again.</p>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Token selector dialog */}
      <Dialog open={showTokenSelector !== null} onOpenChange={(open) => !open && setShowTokenSelector(null)}>
        <DialogContent className="bg-popover border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Select Token</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {Object.entries(commonTokens).map(([symbol, address]: [string, unknown]) => (
              <button
                key={symbol}
                onClick={() => {
                  if (showTokenSelector === "from") {
                    setFromToken(address as string);
                  } else {
                    setToToken(address as string);
                  }
                  setShowTokenSelector(null);
                }}
                className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
              >
                <div className="font-semibold text-foreground">{symbol}</div>
                <div className="text-xs text-muted-foreground font-mono">{address as string}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
