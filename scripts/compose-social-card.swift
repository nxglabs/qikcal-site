import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

private let width = 1_200
private let height = 630
private let colorSpace = CGColorSpaceCreateDeviceRGB()
private let paper = CGColor(red: 0.965, green: 0.945, blue: 0.902, alpha: 1)
private let deepPaper = CGColor(red: 0.918, green: 0.886, blue: 0.824, alpha: 1)
private let ink = CGColor(red: 0.118, green: 0.184, blue: 0.157, alpha: 1)
private let mutedInk = CGColor(red: 0.322, green: 0.392, blue: 0.345, alpha: 1)
private let green = CGColor(red: 0.141, green: 0.357, blue: 0.271, alpha: 1)
private let clay = CGColor(red: 0.722, green: 0.286, blue: 0.169, alpha: 1)

private func drawText(
    _ text: String,
    fontName: String,
    size: CGFloat,
    bold: Bool = false,
    color: CGColor,
    x: CGFloat,
    top: CGFloat,
    context: CGContext
) {
    var font = CTFontCreateWithName(fontName as CFString, size, nil)
    if bold, let boldFont = CTFontCreateCopyWithSymbolicTraits(font, size, nil, .traitBold, .traitBold) {
        font = boldFont
    }
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): color
    ]
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: attributes))
    var ascent = CGFloat.zero
    var descent = CGFloat.zero
    var leading = CGFloat.zero
    _ = CTLineGetTypographicBounds(line, &ascent, &descent, &leading)
    context.textPosition = CGPoint(x: x, y: CGFloat(height) - top - ascent)
    CTLineDraw(line, context)
}

private func compose() throws {
    let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
    let outputURL = root.appendingPathComponent("dist/assets/og-qikcal.jpg")

    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else {
        throw NSError(domain: "QikCalSocialCard", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create the social-card canvas"])
    }

    context.setFillColor(paper)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.setFillColor(deepPaper.copy(alpha: 0.42)!)
    context.fillEllipse(in: CGRect(x: 806, y: -52, width: 450, height: 730))

    drawText("QikCal", fontName: ".AppleSystemUIFont", size: 28, bold: true, color: green, x: 72, top: 42, context: context)
    context.setFillColor(clay)
    context.fillEllipse(in: CGRect(x: 177, y: 572, width: 8, height: 8))

    drawText("A CALM FOOD DIARY", fontName: ".AppleSystemUIFont", size: 14, bold: true, color: clay, x: 72, top: 105, context: context)
    drawText("Your meals,", fontName: "Georgia-Bold", size: 58, color: ink, x: 70, top: 151, context: context)
    drawText("in focus.", fontName: "Georgia-Bold", size: 62, color: clay, x: 70, top: 221, context: context)

    drawText("Offline food search.", fontName: ".AppleSystemUIFont", size: 23, color: mutedInk, x: 74, top: 333, context: context)
    drawText("Portions that fit your plate.", fontName: ".AppleSystemUIFont", size: 23, color: mutedInk, x: 74, top: 371, context: context)
    drawText("Your diary stays on iPhone.", fontName: ".AppleSystemUIFont", size: 23, color: mutedInk, x: 74, top: 409, context: context)

    let chipRect = CGRect(x: 72, y: 118, width: 660, height: 43)
    context.setStrokeColor(CGColor(red: 0.141, green: 0.357, blue: 0.271, alpha: 0.26))
    context.setLineWidth(1)
    context.addPath(CGPath(roundedRect: chipRect, cornerWidth: 22, cornerHeight: 22, transform: nil))
    context.strokePath()
    drawText("No account", fontName: ".AppleSystemUIFont", size: 15, bold: true, color: green, x: 91, top: 477, context: context)
    drawText("·", fontName: ".AppleSystemUIFont", size: 18, color: mutedInk, x: 199, top: 475, context: context)
    drawText("No subscriptions", fontName: ".AppleSystemUIFont", size: 15, bold: true, color: green, x: 219, top: 477, context: context)
    drawText("·", fontName: ".AppleSystemUIFont", size: 18, color: mutedInk, x: 391, top: 475, context: context)
    drawText("No ads", fontName: ".AppleSystemUIFont", size: 15, bold: true, color: green, x: 412, top: 477, context: context)

    context.setStrokeColor(green.copy(alpha: 0.34)!)
    context.setLineWidth(2)
    for inset in stride(from: 0, through: 4, by: 1) {
        let diameter = CGFloat(336 - inset * 42)
        context.strokeEllipse(in: CGRect(x: 832 + CGFloat(inset) * 21, y: 143 + CGFloat(inset) * 21, width: diameter, height: diameter))
    }
    context.setFillColor(clay)
    context.fillEllipse(in: CGRect(x: 976, y: 283, width: 14, height: 14))
    context.setFillColor(green)
    context.fillEllipse(in: CGRect(x: 892, y: 210, width: 10, height: 10))
    context.setFillColor(mutedInk)
    context.fillEllipse(in: CGRect(x: 1061, y: 374, width: 8, height: 8))
    drawText("U.S. + U.K.", fontName: ".AppleSystemUIFont", size: 19, bold: true, color: green, x: 925, top: 284, context: context)
    drawText("Food references, clearly sourced", fontName: ".AppleSystemUIFont", size: 15, color: mutedInk, x: 844, top: 528, context: context)
    drawText("Estimates · offline diary · no subscription", fontName: ".AppleSystemUIFont", size: 14, color: mutedInk, x: 74, top: 568, context: context)

    guard let renderedImage = context.makeImage(),
          let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        throw NSError(domain: "QikCalSocialCard", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not create the social-card JPEG"])
    }
    CGImageDestinationAddImage(destination, renderedImage, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        throw NSError(domain: "QikCalSocialCard", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not encode the social-card JPEG"])
    }
}

private func composeChallenge() throws {
    let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
    let outputURL = root.appendingPathComponent("dist/assets/og-qikcal-challenge.jpg")
    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else {
        throw NSError(domain: "QikCalSocialCard", code: 5, userInfo: [NSLocalizedDescriptionKey: "Could not create the challenge-card canvas"])
    }

    context.setFillColor(paper)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.setFillColor(deepPaper.copy(alpha: 0.46)!)
    context.fillEllipse(in: CGRect(x: 780, y: -75, width: 520, height: 760))

    drawText("QikCal", fontName: ".AppleSystemUIFont", size: 28, bold: true, color: green, x: 72, top: 42, context: context)
    drawText("FOOD FACTS CHALLENGE", fontName: ".AppleSystemUIFont", size: 15, bold: true, color: clay, x: 72, top: 128, context: context)
    drawText("Which food", fontName: "Georgia-Bold", size: 58, color: ink, x: 70, top: 185, context: context)
    drawText("has more?", fontName: "Georgia-Bold", size: 64, color: clay, x: 70, top: 253, context: context)
    drawText("Five quick comparisons.", fontName: ".AppleSystemUIFont", size: 23, color: mutedInk, x: 74, top: 367, context: context)
    drawText("Estimate calories per 100 g.", fontName: ".AppleSystemUIFont", size: 23, color: mutedInk, x: 74, top: 406, context: context)
    drawText("Reference values for selected food records.", fontName: ".AppleSystemUIFont", size: 15, color: mutedInk, x: 74, top: 560, context: context)

    let cardFill = CGColor(red: 0.985, green: 0.975, blue: 0.949, alpha: 1)
    context.setFillColor(cardFill)
    for x in [750.0, 965.0] {
        let card = CGRect(x: x, y: 165, width: 178, height: 300)
        context.addPath(CGPath(roundedRect: card, cornerWidth: 26, cornerHeight: 26, transform: nil))
        context.fillPath()
    }

    drawText("A", fontName: ".AppleSystemUIFont", size: 21, bold: true, color: clay, x: 830, top: 190, context: context)
    drawText("B", fontName: ".AppleSystemUIFont", size: 21, bold: true, color: green, x: 1_044, top: 190, context: context)
    for centerX in [839.0, 1_054.0] {
        context.setStrokeColor(green.copy(alpha: 0.24)!)
        context.setLineWidth(5)
        context.strokeEllipse(in: CGRect(x: centerX - 59, y: 227, width: 118, height: 118))
        context.setStrokeColor(deepPaper)
        context.setLineWidth(3)
        context.strokeEllipse(in: CGRect(x: centerX - 45, y: 241, width: 90, height: 90))
    }
    context.setFillColor(clay)
    context.fillEllipse(in: CGRect(x: 825, y: 273, width: 28, height: 28))
    context.fillEllipse(in: CGRect(x: 1_045, y: 262, width: 16, height: 16))
    context.fillEllipse(in: CGRect(x: 1_061, y: 278, width: 16, height: 16))
    context.fillEllipse(in: CGRect(x: 1_045, y: 294, width: 16, height: 16))
    context.setFillColor(green)
    context.fillEllipse(in: CGRect(x: 1_061, y: 294, width: 16, height: 16))

    let versus = CGRect(x: 922, y: 284, width: 48, height: 48)
    context.setFillColor(ink)
    context.fillEllipse(in: versus)
    drawText("VS", fontName: ".AppleSystemUIFont", size: 14, bold: true, color: cardFill, x: 934, top: 297, context: context)
    drawText("100 g", fontName: ".AppleSystemUIFont", size: 16, bold: true, color: mutedInk, x: 807, top: 408, context: context)
    drawText("100 g", fontName: ".AppleSystemUIFont", size: 16, bold: true, color: mutedInk, x: 1_022, top: 408, context: context)

    guard let renderedImage = context.makeImage(),
          let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        throw NSError(domain: "QikCalSocialCard", code: 6, userInfo: [NSLocalizedDescriptionKey: "Could not create the challenge-card JPEG"])
    }
    CGImageDestinationAddImage(destination, renderedImage, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        throw NSError(domain: "QikCalSocialCard", code: 7, userInfo: [NSLocalizedDescriptionKey: "Could not encode the challenge-card JPEG"])
    }
}

try compose()
try composeChallenge()
print("Wrote dist/assets/og-qikcal.jpg and dist/assets/og-qikcal-challenge.jpg")
