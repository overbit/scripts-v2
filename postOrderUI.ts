import { AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { authority } from "./utils";
import { RPC, programId } from "./utils";
import {
  OpenBookV2Client,
  PlaceOrderArgs,
  Side,
  uiBaseToLots,
  uiPriceToLots,
  uiQuoteToLots,
  Market,
} from "@openbook-dex/openbook-v2";
import { MintUtils } from "./mint_utils";

async function main() {
  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(new Connection(RPC), wallet, {
    commitment: "confirmed",
  });
  const client = new OpenBookV2Client(provider);

  const openOrdersPublicKey = new PublicKey(
    "EuaUfzypbyh5xtKD2nfHEfpQiTr8QSqu4VeRtLrfTF1c"
  );
  const marketPublicKey = new PublicKey(
    "CwHc9CZ9UCZFayz4eBekuhhKsHapLDPYfX4tGFJrnTRt"
  );
  const market = await Market.load(client, marketPublicKey);
  if (!market) {
    throw "No market";
  }

  let mintUtils = new MintUtils(provider.connection, authority);
  const userQuoteAcc = await mintUtils.getOrCreateTokenAccount(
    market?.account.quoteMint,
    authority,
    client.walletPk
  );
  const userBaseAcc = await mintUtils.getOrCreateTokenAccount(
    market?.account.baseMint,
    authority,
    client.walletPk
  );
  mintUtils.mintTo(market?.account.quoteMint, userQuoteAcc.address);
  mintUtils.mintTo(market?.account.baseMint, userBaseAcc.address);

  // @ts-ignore
  let side = Side.Bid;
  let placeOrder = { limit: {} };
  let selfTradeBehavior = { decrementTake: {} };

  // Buy Sol at $20 with $100. Remember SBF was buying all at $3
  // We set the maxBaseLots to maximum or big number to not restrict
  const priceLots = uiPriceToLots(market?.account, 20);
  const maxQuoteLotsIncludingFees = uiQuoteToLots(market?.account, 100);

  const maxBaseLots = uiBaseToLots(market?.account, 1000000);

  let args: PlaceOrderArgs = {
    side,
    priceLots,
    maxBaseLots,
    maxQuoteLotsIncludingFees,
    clientOrderId: new BN(123),
    orderType: placeOrder,
    expiryTimestamp: new BN(0),
    selfTradeBehavior: selfTradeBehavior,
    limit: 255,
  };

  const [ix, signers] = await client.placeOrderIx(
    openOrdersPublicKey,
    marketPublicKey,
    market.account,
    userQuoteAcc.address,
    null,
    args,
    // @ts-ignore
    []
  );
  const tx = await client.sendAndConfirmTransaction([ix], signers);

  console.log("Placed order ", tx);
}

main().catch((err) => console.error(err));
