import { AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { authority } from "./utils";
import { RPC } from "./utils";
import {
  Market,
  OpenBookV2Client,
} from "@openbook-dex/openbook-v2";

async function main() {
  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(new Connection(RPC), wallet, {
    commitment: "confirmed",
  });
  const client = new OpenBookV2Client(provider);

  const marketPublicKey = new PublicKey(
    "BLr5UmvkfoVC4yth5CX2jBT5X75Z61gkLPMbJRNxiRqa"
  );
  const market = await Market.load(client, marketPublicKey);
  if (!market) {
    throw "No market";
  }

  const eventHeap = market.eventHeap?.account;
  if (!eventHeap) {
    throw "No event heap";
  }
  console.log("event heap length", eventHeap.header.count);

  if (eventHeap.header.count > 0) {
    const accounts = await client.getAccountsToConsume(market.account);
    if (accounts) {
      console.log("accounts lenght", accounts.length);

      const ix = await client.consumeEventsIx(
        marketPublicKey,
        market.account,
        new BN(8),
        accounts
      );
      const tx = await client.sendAndConfirmTransaction([ix], {
        additionalSigners: [],
      });
      console.log("Consumed events ", tx);
    }
  }

  //   //   const tx2= await client.pruneOrders(marketPublicKey, market, openOrdersPublicKey, 5, wallet.payer)

  const [ix, signers] = await client.closeMarketIx(
    marketPublicKey,
    market.account,
    wallet.publicKey,
    wallet.payer
  );
  const tx = await client.sendAndConfirmTransaction([ix], {
    additionalSigners: [signers],
  });
  console.log("Closed market ", tx);
}

main();
