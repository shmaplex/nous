// src/orbitdb/save.js
import { create } from "ipfs-core";
import OrbitDB from "@orbitdb/core";

const [title, url, content] = process.argv.slice(2);

async function save() {
  const ipfs = await create({ repo: "./ipfs-orbitdb" });
  const orbitdb = await OrbitDB.createOrbitDB({ ipfs });
  const store = await orbitdb.docstore("demo-articles", { indexBy: "url" });
  await store.load();

  await store.put({ title, url, content });
  console.log("Saved article:", title);

  await store.close();
  await orbitdb.stop();
}

save();