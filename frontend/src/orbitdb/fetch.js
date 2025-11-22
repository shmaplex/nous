// src/orbitdb/fetch.js
import { create } from "ipfs-core";
import OrbitDB from "@orbitdb/core";

async function fetch() {
  const ipfs = await create({ repo: "./ipfs-orbitdb" });
  const orbitdb = await OrbitDB.createOrbitDB({ ipfs });
  const store = await orbitdb.docstore("demo-articles", { indexBy: "url" });
  await store.load();

  const articles = store.query(() => true);
  console.log(JSON.stringify(articles));

  await store.close();
  await orbitdb.stop();
}

fetch();