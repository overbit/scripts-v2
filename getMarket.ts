import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, getProvider, Program, Wallet } from "@coral-xyz/anchor";
import { RPC, authority, getKeypairFromFile, programId } from "./utils";
import * as os from "os";
import {
  OpenBookV2Client,
  IDL,
  type OpenbookV2,
  findAllMarkets,
  Market
} from "@openbook-dex/openbook-v2";

async function main() {
  const connection = new Connection(RPC, "confirmed");
    const wallet = new Wallet(authority);
  
    const provider = new AnchorProvider(new Connection(RPC), wallet, {
      commitment: "confirmed",
    });

    const client = new OpenBookV2Client(provider, programId);

  let market = await Market.load(client, new PublicKey("F9cUzvKFyLUneYWfSx8p638jMNWdKQY1RXrxRmDupdwV") );
  await market.loadOrderBook();

  console.log(market);
}

main();
