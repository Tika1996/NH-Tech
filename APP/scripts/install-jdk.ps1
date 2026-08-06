# Create build-tools folder if it doesn't exist
$buildToolsDir = Join-Path $PSScriptRoot "..\build-tools"
if (!(Test-Path $buildToolsDir)) {
    New-Item -ItemType Directory -Path $buildToolsDir | Out-Null
}

$jdkZip = Join-Path $buildToolsDir "jdk17.zip"
$jdkDest = Join-Path $buildToolsDir "jdk17"

# Clean up empty or broken destination
if (Test-Path $jdkDest) {
    Remove-Item -Path $jdkDest -Recurse -Force | Out-Null
}

# Download JDK 17 if not already downloaded
if (!(Test-Path $jdkZip) -and !(Test-Path $jdkDest)) {
    Write-Host "Downloading Eclipse Temurin JDK 17..."
    $url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
    Invoke-WebRequest -Uri $url -OutFile $jdkZip
}

# Extract JDK 17 if not already extracted
if (!(Test-Path $jdkDest)) {
    Write-Host "Extracting JDK 17..."
    New-Item -ItemType Directory -Path $jdkDest | Out-Null
    
    # Use 7za from node_modules if available, otherwise Expand-Archive
    $sevenZip = Join-Path $PSScriptRoot "..\node_modules\7zip-bin\win\x64\7za.exe"
    if (Test-Path $sevenZip) {
        # Quote the output directory because the path contains spaces
        & $sevenZip x -aoa $jdkZip "-o$jdkDest" | Out-Null
    } else {
        Expand-Archive -Path $jdkZip -DestinationPath $jdkDest -Force
    }
    
    # Remove the zip file to save space if extraction was successful
    if (Test-Path (Join-Path $jdkDest "*")) {
        Remove-Item -Path $jdkZip -Force | Out-Null
    }
}

# Find the java.exe path inside extracted folders
$javaExe = Get-ChildItem -Path $jdkDest -Filter "java.exe" -Recurse | Select-Object -First 1
if ($javaExe) {
    $binDir = $javaExe.Directory.FullName
    $javaHome = $javaExe.Directory.Parent.FullName
    Write-Host "JDK 17 installed successfully!"
    Write-Host "JAVA_HOME: $javaHome"
    Write-Host "Java Path: $($javaExe.FullName)"
} else {
    Write-Error "Failed to locate java.exe in the extracted folder."
}
