import { cheerio } from "crawlx-parse";

const { cheerioOnGotMutable } = cheerio;

import HttpAgent, { HttpsAgent } from "agentkeepalive";
import { ExtendOptions as AgentOptions, Got as Agent } from "got";
import got from "got";

interface CheerioOptions {
  keepRelativeUrl?: boolean;
  disable?: boolean;
}
export { AgentOptions, CheerioOptions, Agent };

export default function agent(
  agentOptions: AgentOptions = {},
  cheerioOptions: CheerioOptions = {}
) {
  const httpAgent = new HttpAgent();
  const httpsAgent = new HttpsAgent();
  agentOptions = {
    agent: {
      http: httpAgent,
      https: httpsAgent
    },
    ...agentOptions
  };
  const instance = got.extend({
    mutableDefaults: true,
    ...agentOptions
  });
  cheerioOnGotMutable(instance, cheerioOptions);
  return instance;
}
