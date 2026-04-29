import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";

const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

export class SwapService {
  provider: BrowserProvider;
  signer: any;
  account: string;

  constructor(externalProvider: any, account: string) {
    this.provider = new BrowserProvider(externalProvider);
    this.account = account;
  }

  async getSigner() {
    if (!this.signer) {
      this.signer = await this.provider.getSigner();
    }
    return this.signer;
  }

  async getTokenContract(token: string) {
    const signer = await this.getSigner();
    return new Contract(token, ERC20_ABI, signer);
  }

  async getRouterContract() {
    const signer = await this.getSigner();
    return new Contract(PANCAKE_ROUTER, ROUTER_ABI, signer);
  }

  async checkAllowance(token: string, spender: string) {
    const contract = await this.getTokenContract(token);
    const allowance = await contract.allowance(this.account, spender);
    return allowance.toString();
  }

  async approveToken(token: string, spender: string, amount: string) {
    const contract = await this.getTokenContract(token);

    const tx = await contract.approve(
      spender,
      parseUnits(amount, 18)
    );

    await tx.wait();

    return {
      success: true,
      hash: tx.hash,
    };
  }

  async getAmountsOut(router: string, amountIn: string, path: string[]) {
    const contract = await this.getRouterContract();

    const amounts = await contract.getAmountsOut(
      parseUnits(amountIn, 18),
      path
    );

    return amounts.map((a: any) => a.toString());
  }

  async swapTokensForTokens(
    router: string,
    amountIn: string,
    amountOutMin: string,
    path: string[]
  ) {
    const contract = await this.getRouterContract();

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min

    const tx = await contract.swapExactTokensForTokens(
      parseUnits(amountIn, 18),
      parseUnits(amountOutMin, 18),
      path,
      this.account,
      deadline
    );

    await tx.wait();

    return {
      success: true,
      hash: tx.hash,
    };
  }
    }
