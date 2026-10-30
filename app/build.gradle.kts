import java.security.KeyStore
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.cert.X509Certificate
import java.util.Properties

plugins { id("com.android.application") }

// Local signing metadata stays ignored. No debug fallback, generated key or credential in argv.
val localSigning = Properties().apply {
    rootProject.file("private/signing.properties").takeIf { it.isFile }?.inputStream()?.use { load(it) }
}
fun signingValue(environment: String, property: String): String? =
    providers.environmentVariable(environment).orNull?.takeIf { it.isNotBlank() }
        ?: localSigning.getProperty(property)?.takeIf { it.isNotBlank() }
fun signingPassword(environment: String, fileProperty: String): String? =
    providers.environmentVariable(environment).orNull?.takeIf { it.isNotEmpty() }
        ?: localSigning.getProperty(fileProperty)?.let { rootProject.file(it) }
            ?.takeIf { it.isFile }?.readText()?.trim()?.takeIf { it.isNotEmpty() }

val releaseStore = signingValue("MARKREAD_RELEASE_STORE_FILE", "storeFile")?.let { rootProject.file(it) }
val releaseStorePassword = signingPassword("MARKREAD_RELEASE_STORE_PASSWORD", "storePasswordFile")
val releaseAlias = signingValue("MARKREAD_RELEASE_KEY_ALIAS", "keyAlias")
val releaseKeyPassword = signingPassword("MARKREAD_RELEASE_KEY_PASSWORD", "keyPasswordFile")
val releaseSigningValid = try {
    require(releaseStore?.isFile == true && releaseStorePassword != null && releaseAlias != null && releaseKeyPassword != null)
    val store = KeyStore.getInstance(releaseStore!!, releaseStorePassword!!.toCharArray())
    require(store.isKeyEntry(releaseAlias))
    val certificate = store.getCertificate(releaseAlias) as X509Certificate
    certificate.checkValidity()
    val fingerprint = MessageDigest.getInstance("SHA-256").digest(certificate.encoded)
        .joinToString("") { "%02x".format(it.toInt() and 255) }
    require(fingerprint == rootProject.file("gradle/release-certificate.sha256").readText().trim())
    require(store.getKey(releaseAlias, releaseKeyPassword!!.toCharArray()) is PrivateKey)
    true
} catch (_: Exception) { false }

android {
    namespace = "vn.markread.local"
    compileSdk = 35
    defaultConfig {
        applicationId = "vn.markread.local"
        minSdk = 26
        targetSdk = 35
        versionCode = 121
        versionName = "1.2.1"
        testInstrumentationRunner = "vn.markread.local.tests.ProbeInstrumentation"
    }
    signingConfigs {
        if (releaseSigningValid) create("localRelease") {
            storeFile = releaseStore
            storePassword = releaseStorePassword
            keyAlias = releaseAlias
            keyPassword = releaseKeyPassword
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            isShrinkResources = false
            isDebuggable = false
            if (releaseSigningValid) signingConfig = signingConfigs.getByName("localRelease")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_1_8; targetCompatibility = JavaVersion.VERSION_1_8 }
}

val verifyReleaseSigning by tasks.registering {
    doLast {
        if (!releaseSigningValid) throw GradleException(
            "SIGNING BLOCKED: supply the existing compatible release identity through environment or private/signing.properties. No key is generated."
        )
    }
}
tasks.configureEach { if (name == "preReleaseBuild") dependsOn(verifyReleaseSigning) }
