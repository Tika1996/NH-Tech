# Set paths
$sdkRoot = "C:\Users\SAMSUNG\AppData\Local\Android\Sdk"
$platformsDir = Join-Path $sdkRoot "platforms"
$buildToolsDir = Join-Path $sdkRoot "build-tools"
$workDir = Join-Path $PSScriptRoot "..\build-tools"

# Create directories
if (!(Test-Path $platformsDir)) { New-Item -ItemType Directory -Path $platformsDir | Out-Null }
if (!(Test-Path $buildToolsDir)) { New-Item -ItemType Directory -Path $buildToolsDir | Out-Null }

$platformZip = Join-Path $workDir "platform-34.zip"
$platformDest = Join-Path $platformsDir "android-34"
$platformTemp = Join-Path $workDir "platform-34-temp"

$buildToolsZip = Join-Path $workDir "build-tools-34.zip"
$buildToolsDest = Join-Path $buildToolsDir "34.0.0"
$buildToolsTemp = Join-Path $workDir "build-tools-34-temp"

$sevenZip = Join-Path $PSScriptRoot "..\node_modules\7zip-bin\win\x64\7za.exe"

# 1. Download and extract SDK Platform 34
if (!(Test-Path $platformDest)) {
    if (!(Test-Path $platformZip)) {
        Write-Host "Downloading Android SDK Platform 34..."
        $url = "https://dl.google.com/android/repository/platform-34-ext7_r03.zip"
        Invoke-WebRequest -Uri $url -OutFile $platformZip
    }
    
    Write-Host "Extracting Platform 34..."
    if (Test-Path $platformTemp) { Remove-Item -Path $platformTemp -Recurse -Force | Out-Null }
    New-Item -ItemType Directory -Path $platformTemp | Out-Null
    
    if (Test-Path $sevenZip) {
        & $sevenZip x -aoa $platformZip "-o$platformTemp" | Out-Null
    } else {
        Expand-Archive -Path $platformZip -DestinationPath $platformTemp -Force
    }
    
    # Move extracted android-34 folder to Sdk/platforms/android-34
    Move-Item -Path (Join-Path $platformTemp "android-34") -Destination $platformDest -Force
    
    # Cleanup
    Remove-Item -Path $platformTemp -Recurse -Force | Out-Null
    Remove-Item -Path $platformZip -Force | Out-Null
    Write-Host "Android SDK Platform 34 installed successfully!"
} else {
    Write-Host "Android SDK Platform 34 already installed."
}

# 2. Download and extract Build Tools 34.0.0
if (!(Test-Path $buildToolsDest)) {
    if (!(Test-Path $buildToolsZip)) {
        Write-Host "Downloading Android SDK Build-Tools 34.0.0..."
        $url = "https://dl.google.com/android/repository/build-tools_r34-windows.zip"
        Invoke-WebRequest -Uri $url -OutFile $buildToolsZip
    }
    
    Write-Host "Extracting Build-Tools 34.0.0..."
    if (Test-Path $buildToolsTemp) { Remove-Item -Path $buildToolsTemp -Recurse -Force | Out-Null }
    New-Item -ItemType Directory -Path $buildToolsTemp | Out-Null
    
    if (Test-Path $sevenZip) {
        & $sevenZip x -aoa $buildToolsZip "-o$buildToolsTemp" | Out-Null
    } else {
        Expand-Archive -Path $buildToolsZip -DestinationPath $buildToolsTemp -Force
    }
    
    # Move extracted android-14 folder to Sdk/build-tools/34.0.0
    # Note: Google packages build-tools in an "android-14" folder inside the zip
    Move-Item -Path (Join-Path $buildToolsTemp "android-14") -Destination $buildToolsDest -Force
    
    # Cleanup
    Remove-Item -Path $buildToolsTemp -Recurse -Force | Out-Null
    Remove-Item -Path $buildToolsZip -Force | Out-Null
    Write-Host "Android SDK Build-Tools 34.0.0 installed successfully!"
} else {
    Write-Host "Android SDK Build-Tools 34.0.0 already installed."
}

# 3. Create SDK License Approval file so Gradle doesn't complain about license agreements
$licensesDir = Join-Path $sdkRoot "licenses"
if (!(Test-Path $licensesDir)) { New-Item -ItemType Directory -Path $licensesDir | Out-Null }
$licenseFile = Join-Path $licensesDir "android-sdk-license"
# The SHA-256 hash for accepting the Android SDK license
$licenseHash = "8933bad161ad9cd69077a10a6513106b83b08e4dcf386e3f6e2e985160752b11`n859226b922e54e055675e2d10ecb49e548d0b0547af05e114e405e609ca08f1b`n24333f8a63b6111e8ca1e32299086577bf6b44198458908d491d78d6c4b1885d"
Set-Content -Path $licenseFile -Value $licenseHash -NoNewline
Write-Host "Accepted Android SDK licenses."
