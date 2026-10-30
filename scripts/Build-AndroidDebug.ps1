[CmdletBinding()]
param(
    [string]$JavaHome,
    [string]$SdkRoot,
    [string]$GradleUserHome,
    [switch]$Offline,
    [switch]$RerunTasks
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $JavaHome) {
    $JavaHome = $env:JAVA_HOME
    if (-not $JavaHome) {
        $jdkRoot = Join-Path $repoRoot 'toolchain/jdk'
        if (Test-Path -LiteralPath $jdkRoot) {
            $jdk = Get-ChildItem -LiteralPath $jdkRoot -Directory |
                Where-Object { $_.Name -like 'jdk-17*' } |
                Sort-Object Name -Descending | Select-Object -First 1
            if ($jdk) { $JavaHome = $jdk.FullName }
        }
    }
}
if (-not $JavaHome -or -not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin/java.exe'))) {
    throw 'Provide a JDK17 using -JavaHome or JAVA_HOME. See docs/ui-redesign/ANDROID_BUILD_GATE.md.'
}
if (-not $SdkRoot) {
    $SdkRoot = $env:ANDROID_HOME
    if (-not $SdkRoot) { $SdkRoot = $env:ANDROID_SDK_ROOT }
    if (-not $SdkRoot) { $SdkRoot = Join-Path $repoRoot 'toolchain/android-sdk' }
}
foreach ($required in @('platforms/android-35/android.jar', 'build-tools/34.0.0/aapt2.exe')) {
    if (-not (Test-Path -LiteralPath (Join-Path $SdkRoot $required))) {
        throw "Missing SDK component: $required. See docs/ui-redesign/ANDROID_BUILD_GATE.md."
    }
}
if (-not $GradleUserHome) { $GradleUserHome = Join-Path $repoRoot '.gradle/user-home' }

$savedEnvironment = @{}
$names = @('JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT', 'ANDROID_USER_HOME', 'GRADLE_USER_HOME')
foreach ($name in $names) { $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$locationPushed = $false
try {
    $env:JAVA_HOME = (Resolve-Path -LiteralPath $JavaHome).Path
    $env:ANDROID_HOME = (Resolve-Path -LiteralPath $SdkRoot).Path
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    $env:ANDROID_USER_HOME = Join-Path $repoRoot 'build/android-build-gate/android-user'
    $env:GRADLE_USER_HOME = $GradleUserHome
    Push-Location -LiteralPath $repoRoot
    $locationPushed = $true
    $gradleArgs = @('--no-daemon', '--console=plain', '--stacktrace')
    if ($Offline) { $gradleArgs += '--offline' }
    if ($RerunTasks) { $gradleArgs += '--rerun-tasks' }
    $gradleArgs += 'assembleDebug'
    & (Join-Path $repoRoot 'gradlew.bat') @gradleArgs
    if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug failed (exit $LASTEXITCODE)." }
    $apk = Join-Path $repoRoot 'app/build/outputs/apk/debug/app-debug.apk'
    if (-not (Test-Path -LiteralPath $apk)) { throw 'Gradle returned success without the expected debug APK.' }
    $artifact = Get-Item -LiteralPath $apk
    Write-Output "APK: $($artifact.FullName)"
    Write-Output "Bytes: $($artifact.Length)"
    Write-Output "SHA-256: $((Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant())"
}
finally {
    if ($locationPushed) { Pop-Location }
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process') }
}
