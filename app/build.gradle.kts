plugins { id("com.android.application") }
android {
    namespace = "vn.markread.local"
    compileSdk = 35
    defaultConfig {
        applicationId = "vn.markread.local"
        minSdk = 26
        targetSdk = 35
        versionCode = 113
        versionName = "1.1.3"
        testInstrumentationRunner = "vn.markread.local.tests.ProbeInstrumentation"
    }
    val key = rootProject.file("private/markread-release.p12")
    val pass = rootProject.file("private/keystore-password.txt")
    signingConfigs {
        if (key.exists() && pass.exists()) create("localRelease") {
            storeFile = key
            storePassword = pass.readText().trim()
            keyAlias = "markread"
            keyPassword = storePassword
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            isDebuggable = false
            if (key.exists() && pass.exists()) signingConfig = signingConfigs.getByName("localRelease")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_1_8; targetCompatibility = JavaVersion.VERSION_1_8 }
}
