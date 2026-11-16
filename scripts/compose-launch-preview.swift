import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

private let width = 1_080
private let height = 1_920
private let colorSpace = CGColorSpaceCreateDeviceRGB()
private let paper = CGColor(red: 0.965, green: 0.945, blue: 0.902, alpha: 1)
private let card = CGColor(red: 0.999, green: 0.992, blue: 0.969, alpha: 1)
private let ink = CGColor(red: 0.118, green: 0.184, blue: 0.157, alpha: 1)
private let muted = CGColor(red: 0.36, green: 0.42, blue: 0.38, alpha: 1)
private let clay = CGColor(red: 0.72, green: 0.29, blue: 0.17, alpha: 1)

private struct Slide {
    let source: String
    let title: String
    let subtitle: String
}

private let slides = [
    Slide(source: "01-today.jpg", title: "Log the meal you ate", subtitle: "Keep your day in one calm place"),
    Slide(source: "02-food-search-idli.jpg", title: "Find food, set a portion", subtitle: "Search the USDA catalogue offline"),
    Slide(source: "03-saved-meals.jpg", title: "Save meals you repeat", subtitle: "Bring a saved meal back when you need it"),
    Slide(source: "04-week.jpg", title: "See your week, clearly", subtitle: "Share a recap only when you choose")
]

private func makeLine(_ value: String, size: CGFloat, bold: Bool, color: CGColor) -> CTLine {
    let systemFont = CTFontCreateUIFontForLanguage(.system, size, nil)!
    let font = bold
        ? (CTFontCreateCopyWithSymbolicTraits(systemFont, size, nil, .traitBold, .traitBold) ?? systemFont)
        : systemFont
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): color
    ]
    return CTLineCreateWithAttributedString(NSAttributedString(string: value, attributes: attributes))
}

private func drawCenteredText(
    _ value: String,
    size: CGFloat,
    bold: Bool,
    color: CGColor,
    top: CGFloat,
    maxWidth: CGFloat,
    context: CGContext
) {
    var fontSize = size
    var line = makeLine(value, size: fontSize, bold: bold, color: color)
    var ascent = CGFloat.zero
    var descent = CGFloat.zero
    var leading = CGFloat.zero
    var lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
    while lineWidth > maxWidth, fontSize > 26 {
        fontSize -= 1
        line = makeLine(value, size: fontSize, bold: bold, color: color)
        lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
    }
    context.textPosition = CGPoint(x: (CGFloat(width) - lineWidth) / 2, y: CGFloat(height) - top - ascent)
    CTLineDraw(line, context)
}

private func loadImage(at url: URL) throws -> CGImage {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "QikCalLaunchPreview", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not load screenshot at \(url.path)"])
    }
    return image
}

private func makeContext() throws -> CGContext {
    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw NSError(domain: "QikCalLaunchPreview", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create a preview frame"])
    }
    return context
}

private func save(_ context: CGContext, to url: URL) throws {
    guard let image = context.makeImage(),
          let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw NSError(domain: "QikCalLaunchPreview", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not write frame at \(url.path)"])
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        throw NSError(domain: "QikCalLaunchPreview", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not finalize frame at \(url.path)"])
    }
}

private func compose(_ slide: Slide, from inputDirectory: URL, to outputURL: URL) throws {
    let context = try makeContext()
    context.setFillColor(paper)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    drawCenteredText("QikCal", size: 33, bold: true, color: clay, top: 43, maxWidth: 900, context: context)
    drawCenteredText(slide.title, size: 49, bold: true, color: ink, top: 94, maxWidth: 960, context: context)
    drawCenteredText(slide.subtitle, size: 26, bold: false, color: muted, top: 156, maxWidth: 970, context: context)

    let screenshot = try loadImage(at: inputDirectory.appendingPathComponent(slide.source))
    let imageHeight: CGFloat = 1_465
    let imageWidth = imageHeight * CGFloat(screenshot.width) / CGFloat(screenshot.height)
    let imageRect = CGRect(x: (CGFloat(width) - imageWidth) / 2, y: 225, width: imageWidth, height: imageHeight)
    let frameRect = imageRect.insetBy(dx: -13, dy: -13)
    let framePath = CGPath(roundedRect: frameRect, cornerWidth: 34, cornerHeight: 34, transform: nil)

    context.saveGState()
    context.setShadow(offset: CGSize(width: 0, height: 18), blur: 34, color: CGColor(red: 0.1, green: 0.14, blue: 0.12, alpha: 0.16))
    context.addPath(framePath)
    context.setFillColor(card)
    context.fillPath()
    context.restoreGState()

    context.saveGState()
    context.addPath(CGPath(roundedRect: imageRect, cornerWidth: 23, cornerHeight: 23, transform: nil))
    context.clip()
    context.interpolationQuality = .high
    context.draw(screenshot, in: imageRect)
    context.restoreGState()

    drawCenteredText("Sample screen · USDA calorie values are estimates", size: 20, bold: false, color: muted, top: 1_795, maxWidth: 1_000, context: context)
    try save(context, to: outputURL)
}

private func composeEndCard(to outputURL: URL) throws {
    let context = try makeContext()
    context.setFillColor(paper)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    context.setFillColor(CGColor(red: 0.91, green: 0.86, blue: 0.76, alpha: 0.58))
    context.fillEllipse(in: CGRect(x: 160, y: 665, width: 760, height: 760))
    drawCenteredText("QikCal", size: 86, bold: true, color: clay, top: 555, maxWidth: 900, context: context)
    drawCenteredText("Your meals, in focus.", size: 43, bold: false, color: ink, top: 700, maxWidth: 930, context: context)
    drawCenteredText("Offline · No account · No subscription", size: 25, bold: true, color: ink, top: 1_270, maxWidth: 1_000, context: context)
    drawCenteredText("Being prepared for the App Store", size: 25, bold: false, color: muted, top: 1_405, maxWidth: 920, context: context)
    drawCenteredText("cal.qik.ai", size: 22, bold: true, color: clay, top: 1_820, maxWidth: 950, context: context)
    try save(context, to: outputURL)
}

func run() throws {
    guard CommandLine.arguments.count == 3 else {
        throw NSError(domain: "QikCalLaunchPreview", code: 5, userInfo: [NSLocalizedDescriptionKey: "Usage: compose-launch-preview.swift <screenshots> <output-directory>"])
    }
    let inputDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
    let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
    try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
    for (index, slide) in slides.enumerated() {
        try compose(slide, from: inputDirectory, to: outputDirectory.appendingPathComponent(String(format: "%02d-preview.png", index + 1)))
    }
    try composeEndCard(to: outputDirectory.appendingPathComponent("05-end-card.png"))
}

try run()
