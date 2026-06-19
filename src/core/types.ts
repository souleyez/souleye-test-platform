export type AiJudgeMode = "off" | "warn" | "fail";

export type PageEvidence = {
  url: string;
  screenshotPath: string;
  title: string;
  bodyText: string;
};

export type AiJudgeResult = {
  pass: boolean;
  score: number;
  reason: string;
  evidence: string[];
};

export type AiJudgeProvider = (input: {
  pageName: string;
  evidence: PageEvidence;
}) => Promise<AiJudgeResult>;

export type PageQualityOptions = {
  mode?: AiJudgeMode;
  expectedContent?: Array<string | RegExp>;
  provider?: AiJudgeProvider;
};

