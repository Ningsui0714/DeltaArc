import { serverConfig } from '../../config';
import type {
  PreflightMediaAsset,
  PreflightSimulationRequest,
} from '../../../shared/preflightSimulation';
import { createDoubaoPreflightProvider } from './doubaoProvider';
import { createMockPreflightProvider } from './mockProvider';

export type PreflightImagePayload = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
};

export type PreflightProviderInput = {
  request: PreflightSimulationRequest;
  systemPrompt: string;
  userPrompt: string;
  images: PreflightImagePayload[];
};

export type PreflightModelProvider = {
  provider: 'doubao' | 'mock';
  model: string;
  generateJson: (input: PreflightProviderInput) => Promise<Record<string, unknown>>;
};

export class PreflightProviderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PreflightProviderError';
    this.code = code;
  }
}

export function resolveImagePayloads(mediaAssets: PreflightMediaAsset[]): PreflightImagePayload[] {
  return mediaAssets.map((asset) => {
    const url = resolveImageUrl(asset);

    return {
      id: asset.id,
      name: asset.name,
      mimeType: asset.mimeType,
      url,
    };
  });
}

function resolveImageUrl(asset: PreflightMediaAsset) {
  if (asset.dataUrl) {
    return asset.dataUrl;
  }

  if (asset.url) {
    return asset.url;
  }

  if (asset.base64) {
    return `data:${asset.mimeType};base64,${asset.base64}`;
  }

  if (asset.imagePath) {
    throw new PreflightProviderError(
      'IMAGE_PATH_NOT_RESOLVED',
      '图片路径需要先由 CLI 或前端转换为 base64/data URL，API 不直接读取本地路径。',
    );
  }

  throw new PreflightProviderError(
    'IMAGE_PAYLOAD_MISSING',
    `图片 ${asset.name || asset.id} 缺少 dataUrl、base64 或 url。`,
  );
}

export function createPreflightModelProvider(provider = serverConfig.preflightProvider) {
  if (provider === 'mock') {
    return createMockPreflightProvider();
  }

  return createDoubaoPreflightProvider();
}
