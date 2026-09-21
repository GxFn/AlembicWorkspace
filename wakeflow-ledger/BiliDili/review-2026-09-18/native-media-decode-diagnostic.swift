// 独立 AVFoundation 解码诊断：不链接 AOXPlayer，不读取 App 账号或缓存索引。
// 对同一本地媒体每次新建 generator，采样 100/55/0 秒并导出 PNG。
// 本程序不检验码流标准，也不代替真机播放验证。
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

@main struct MediaColorDiagnostic {
    @MainActor static func main() async throws {
        guard CommandLine.arguments.count == 3 else {
            print("Usage: native-media-decode-diagnostic <local-video-file> <output-directory>")
            return
        }
        let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
        let outputURL = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
        try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)
        let asset = AVURLAsset(url: inputURL)
        for seconds in [100.0, 55.0, 0.0] {
            let generator = AVAssetImageGenerator(asset: asset)
            generator.requestedTimeToleranceBefore = .zero
            generator.requestedTimeToleranceAfter = .zero
            let result = try await generator.image(at: CMTime(seconds: seconds, preferredTimescale: 600))
            if let destination = CGImageDestinationCreateWithURL(outputURL.appendingPathComponent("native-frame-\(Int(seconds)).png") as CFURL, UTType.png.identifier as CFString, 1, nil) {
                CGImageDestinationAddImage(destination, result.image, nil)
                print("nativePNG=\(CGImageDestinationFinalize(destination))")
            }
            let size = 64
            var pixels = [UInt8](repeating: 0, count: size * size * 4)
            let sampled = pixels.withUnsafeMutableBytes { bytes -> Bool in
                guard let context = CGContext(data: bytes.baseAddress, width: size, height: size,
                    bitsPerComponent: 8, bytesPerRow: size * 4, space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
                context.draw(result.image, in: CGRect(x: 0, y: 0, width: size, height: size))
                return true
            }
            var totals = [Int](repeating: 0, count: 3)
            if sampled {
                for offset in stride(from: 0, to: pixels.count, by: 4) {
                    for channel in 0..<3 { totals[channel] += Int(pixels[offset + channel]) }
                }
            }
            print("time=\(seconds), RGBmean=\(totals.map { Double($0) / Double(size * size) })")
        }
    }
}
