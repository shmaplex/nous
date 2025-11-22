// src/orbitdb/server.js
import { create } from "ipfs-core";
import OrbitDB from "@orbitdb/core";
import { v4 as uuidv4 } from "uuid";

async function start() {
  const ipfs = await create({ repo: "./ipfs-orbitdb", config: { Bootstrap: [] } });
  const orbitdb = await OrbitDB.createOrbitDB({ ipfs });
  const store = await orbitdb.docstore(`/orbitdb/${uuidv4()}-articles`, { indexBy: "url" });

  await store.load();
  console.log("OrbitDB server started. Store address:", store.address.toString());

  process.on("SIGINT", async () => {
    console.log("Shutting down OrbitDB server...");
    await store.close();
    await orbitdb.stop();
    process.exit();
  });
}

start();