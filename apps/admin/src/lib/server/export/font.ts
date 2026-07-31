import { read } from '$app/server';
import notoFontAsset from './assets/NotoSansCJKtc-Regular.otf?url';

let fontPromise: Promise<Buffer> | undefined;

export function getPdfFont(): Promise<Buffer> {
	if (!fontPromise) {
		fontPromise = read(notoFontAsset)
			.arrayBuffer()
			.then((font) => Buffer.from(font));
	}
	return fontPromise;
}
