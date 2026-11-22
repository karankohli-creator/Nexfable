Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class LogoProcessor {
    public static void Process(string srcPath, string outDir) {
        using (Bitmap src = new Bitmap(srcPath)) {
            int w = src.Width;
            int h = src.Height;

            BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] srcBytes = new byte[w * h * 4];
            Marshal.Copy(srcData.Scan0, srcBytes, 0, srcBytes.Length);
            src.UnlockBits(srcData);

            // Sample background color average from the 4 corners
            int[] corners = new int[] { (5 * w + 5) * 4, (5 * w + (w - 6)) * 4, ((h - 6) * w + 5) * 4, ((h - 6) * w + (w - 6)) * 4 };
            double bgR = 0, bgG = 0, bgB = 0;
            foreach (int ci in corners) {
                bgB += srcBytes[ci];
                bgG += srcBytes[ci + 1];
                bgR += srcBytes[ci + 2];
            }
            bgR /= 4.0; bgG /= 4.0; bgB /= 4.0;

            Console.WriteLine(string.Format("Avg BG: R={0:F1}, G={1:F1}, B={2:F1}", bgR, bgG, bgB));

            // Function to extract a rectangle and un-matte from dark background
            Action<int, int, int, int, string> extractUnmatte = (minX, minY, cropW, cropH, outName) => {
                using (Bitmap outBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb)) {
                    BitmapData outData = outBmp.LockBits(new Rectangle(0, 0, cropW, cropH), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                    byte[] outBytes = new byte[cropW * cropH * 4];

                    for (int y = 0; y < cropH; y++) {
                        for (int x = 0; x < cropW; x++) {
                            int sx = minX + x;
                            int sy = minY + y;
                            if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

                            int si = (sy * w + sx) * 4;
                            double b = srcBytes[si];
                            double g = srcBytes[si + 1];
                            double r = srcBytes[si + 2];

                            // Color difference from background
                            double dr = r - bgR;
                            double dg = g - bgG;
                            double db = b - bgB;
                            double dist = Math.Sqrt(dr * dr + dg * dg + db * db);

                            // We determine alpha.
                            // Background noise threshold: dist < 12 => alpha = 0
                            // Smooth ramp between dist = 12 and dist = 45, full opacity above 45
                            double alpha = 0.0;
                            if (dist > 10.0) {
                                alpha = (dist - 10.0) / 32.0;
                                if (alpha > 1.0) alpha = 1.0;
                            }

                            int oi = (y * cropW + x) * 4;
                            if (alpha <= 0.0) {
                                outBytes[oi] = 0;
                                outBytes[oi + 1] = 0;
                                outBytes[oi + 2] = 0;
                                outBytes[oi + 3] = 0;
                            } else {
                                // Un-matte foreground color:
                                // C = alpha * F + (1 - alpha) * B => F = (C - (1 - alpha) * B) / alpha
                                double fgR = (r - (1.0 - alpha) * bgR) / alpha;
                                double fgG = (g - (1.0 - alpha) * bgG) / alpha;
                                double fgB = (b - (1.0 - alpha) * bgB) / alpha;

                                fgR = Math.Max(0.0, Math.Min(255.0, fgR));
                                fgG = Math.Max(0.0, Math.Min(255.0, fgG));
                                fgB = Math.Max(0.0, Math.Min(255.0, fgB));

                                outBytes[oi] = (byte)Math.Round(fgB);
                                outBytes[oi + 1] = (byte)Math.Round(fgG);
                                outBytes[oi + 2] = (byte)Math.Round(fgR);
                                outBytes[oi + 3] = (byte)Math.Round(alpha * 255.0);
                            }
                        }
                    }

                    Marshal.Copy(outBytes, 0, outData.Scan0, outBytes.Length);
                    outBmp.UnlockBits(outData);
                    outBmp.Save(System.IO.Path.Combine(outDir, outName), ImageFormat.Png);
                    Console.WriteLine("Saved: " + outName);
                }
            };

            // 1. Symbol Only: X=232..524 (W=293), Y=135..274 (H=140)
            // Add slight 8px margin
            int symX = 224; int symY = 128; int symW = 308; int symH = 152;
            extractUnmatte(symX, symY, symW, symH, "nexfable-symbol.png");

            // 2. Wordmark Only: X=105..595 (W=491), Y=275..356 (H=82)
            int wordX = 98; int wordY = 270; int wordW = 504; int wordH = 92;
            extractUnmatte(wordX, wordY, wordW, wordH, "nexfable-wordmark.png");

            // 3. Stacked Logo (Symbol + Wordmark): X=98..602, Y=128..362
            int stX = 98; int stY = 128; int stW = 504; int stH = 234;
            extractUnmatte(stX, stY, stW, stH, "nexfable-stacked.png");

            // 4. App Icon Right: X=666..926 (W=261), Y=167..365 (H=199)
            // Wait, let's examine exact bounds of the rounded square on the right
            int iconX = 660; int iconY = 160; int iconW = 272; int iconH = 212;
            extractUnmatte(iconX, iconY, iconW, iconH, "nexfable-icon-raw.png");
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

$src = "C:\Users\asm\.gemini\antigravity\brain\6f2bf688-8a39-439c-ba41-3fe130331a2a\.user_uploaded\media_1795340852853_09f47c27.jpg"
$out = "C:\Users\asm\Desktop\business website\public\images"
[LogoProcessor]::Process($src, $out)
