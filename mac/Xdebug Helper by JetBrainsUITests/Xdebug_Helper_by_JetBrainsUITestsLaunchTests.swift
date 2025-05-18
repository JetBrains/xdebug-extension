//
//  Xdebug_Helper_by_JetBrainsUITestsLaunchTests.swift
//  Xdebug Helper by JetBrainsUITests
//
//  Created by fraserchapman on 23/04/2025.
//

import XCTest

final class Xdebug_Helper_by_JetBrainsUITestsLaunchTests: XCTestCase {

    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()

        // Insert steps here to perform after app launch but before taking a screenshot,
        // such as logging into a test account or navigating somewhere in the app

        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
