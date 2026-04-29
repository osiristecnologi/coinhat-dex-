import { useState, useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { useWeb3, NETWORKS } from "../contexts/Web3Context";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import {
  AlertCircle,
  ArrowDownUp,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";
import { SwapService } from "../lib/swapService";

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
  const { provider, account, network, isConnected, connectWallet } =
    useWeb3();

  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [swapStatus, setSwapStatus] = useState<SwapStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState<
    "from" | "to" | null
  >(null);
  const [loading, setLoading] = useState(false);

  const networkConfig = network ? NETWORKS[network] : null;
  const commonTokens =
    network ? (COMMON_TOKENS[network] as Record<string, string>) : {};

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

      const allowance = await swapService.checkAllowance(
        fromToken,
        networkConfig.routerAddress
      );

      if (parseFloat(allowance) < parseFloat(fromAmount)) {
        const approvalResult = await swapService.approveToken(
          fromToken,
          networkConfig.routerAddress,
          fromAmount
        );

        if (!approvalResult.success) {
          throw new Error("Approval failed");
        }

        toast.success("Token approved!");
      }

      setSwapStatus("swapping");

      const path = [fromToken, toToken];

      const amountOutMin = (
        parseFloat(toAmount) *
        (1 - parseFloat(slippage) / 100)
      ).toString();

      const swapResult = await swapService.swapTokensForTokens(
        networkConfig.routerAddress,
        fromAmount,
        amountOutMin,
        path
      );

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
    if (!provider || !networkConfig || !fromToken || !toToken || !fromAmount)
      return;

    try {
      setLoading(true);
      const swapService = new SwapService(provider, account!);

      const amounts = await swapService.getAmountsOut(
        networkConfig.routerAddress,
        fromAmount,
        [fromToken, toToken]
      );

      setToAmount(amounts[amounts.length - 1] || "0");
    } catch {
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
              <h2 className="text-xl font-bold text-foreground">
                {t("connectWallet")}
              </h2>

              <Button
                onClick={connectWallet}
                className="w-full"
                style={{
                  background: "var(--coinhat-yellow)",
                  color: "#0a0a0f",
                }}
              >
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
          <Card className="p-3 bg-card border-border">
            <div className="text-xs text-muted-foreground">
              Network:{" "}
              <span className="font-semibold text-foreground">
                {network?.toUpperCase()}
              </span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground">Swap</h2>

            <Input
              placeholder="From token"
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
            />

            <Input
              placeholder="Amount"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />

            <Input
              placeholder="To token"
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
            />

            <Input
              placeholder="Slippage"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />

            <Button
              onClick={handleSwap}
              disabled={loading}
              style={{
                background: "var(--coinhat-yellow)",
                color: "#0a0a0f",
              }}
            >
              {loading ? "Loading..." : "Swap"}
            </Button>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
