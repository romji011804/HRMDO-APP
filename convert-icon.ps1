Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Windows 10\Downloads\appicon\appicon.png"
$dstPath = Join-Path $PSScriptRoot "build\icon.ico"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($srcImg, 0, 0, $size, $size)
$g.Dispose()

$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()
$srcImg.Dispose()

$iconStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($iconStream)

# ICONDIR
$writer.Write([uint16]0)   # reserved
$writer.Write([uint16]1)   # type = ICO
$writer.Write([uint16]1)   # count = 1

# ICONDIRENTRY
$writer.Write([byte]0)     # width  (0 = 256)
$writer.Write([byte]0)     # height (0 = 256)
$writer.Write([byte]0)     # color count
$writer.Write([byte]0)     # reserved
$writer.Write([uint16]1)   # planes
$writer.Write([uint16]32)  # bit count
$writer.Write([uint32]$pngBytes.Length)
$writer.Write([uint32]22)  # image data offset (6 + 16)

# PNG data
$writer.Write($pngBytes)
$writer.Flush()

[System.IO.File]::WriteAllBytes($dstPath, $iconStream.ToArray())
$iconStream.Dispose()

Write-Host "Done! Valid ICO saved to: $dstPath"
