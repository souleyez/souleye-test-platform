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
  expectationProfile?: PageExpectationProfile;
}) => Promise<AiJudgeResult>;

export type PageExpectationProfile = {
  expectedContent?: Array<string | RegExp>;
  minBodyTextLength?: number;
};

export type PageQualityOptions = {
  mode?: AiJudgeMode;
  expectedContent?: Array<string | RegExp>;
  expectationProfile?: PageExpectationProfile;
  provider?: AiJudgeProvider;
};
