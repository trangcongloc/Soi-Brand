$filePath = "components\ReportDisplay.tsx"
$content = Get-Content $filePath -Raw

# Add onReset prop to interface
$content = $content -replace 'interface ReportDisplayProps \{[\r\n\s]+report: MarketingReport;[\r\n\s]+\}', 'interface ReportDisplayProps {
    report: MarketingReport;
    onReset?: () => void;
}'

# Update component signature  
$content = $content -replace 'const ReportDisplay: React\.FC<ReportDisplayProps> = \(\{ report \}\) =>', 'const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) =>'

Set-Content $filePath -Value $content -NoNewline
Write-Host "✅ Successfully updated ReportDisplay.tsx"
