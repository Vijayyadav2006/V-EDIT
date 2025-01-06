<?php
$language = strtolower($_POST['language']);
$code = $_POST['code'];

$random = substr(md5(mt_rand()), 0, 7);
$filePath = "temp/" . $random . "." . $language;
$programFile = fopen($filePath, "w");
fwrite($programFile, $code);
fclose($programFile);

// Sanitize file path to avoid shell injection
$filePathEscaped = escapeshellarg($filePath);


if ($language == "php") {
    $output = shell_exec("C:\wamp64\bin\php\php8.3.14\php.exe $filePath 2>&1");
    echo $output;
}
if ($language == "python") {
    $output = shell_exec("C:\TurboC++\Python\Python312\python.exe $filePath 2>&1");
    if (strpos($output, "error") === false) {
        $output = shell_exec("C:\TurboC++\Python\Python312\python.exe $filePath 2>&1");
    }

    echo $output;
}
if ($language == "node") {
    rename($filePath, $filePath.".js");
    $output = shell_exec("node $filePath.js 2>&1");
    if (strpos($output, "error") === false) {
        // Execute the compiled Java class
        $output = shell_exec("node $filePathEscaped.js 2>&1");
    }
    echo $output;
}
if ($language == "c") {
    // Generate a random output executable name
    $outputExe = $random . ".exe";

    // Compile the C file
    $compileCommand = "gcc " . escapeshellarg($filePath) . " -o " . escapeshellarg($outputExe);
    $compileOutput = shell_exec($compileCommand . " 2>&1");

    // Check if there are compilation errors
    if (strpos($compileOutput, "error") === false) {
        // Execute the compiled executable
        $executeCommand = escapeshellarg($outputExe);
        $output = shell_exec($executeCommand . " 2>&1");
        echo $output;
    } else {
        // Output the compilation errors
        echo "Compilation Error: \n" . $compileOutput;
    }
}

if ($language == "cpp") {
    // Generate a random output executable name
    $outputExe = $random . ".exe";

    // Define the full path to TDM-GCC's g++ compiler
    $gppPath = "C:\\TDM-GCC-64\\bin\\g++";

    // Compile the C++ file
    $compileCommand = $gppPath . " " . escapeshellarg($filePath) . " -o " . escapeshellarg(__DIR__ . "\\" . $outputExe);
    $compileOutput = shell_exec($compileCommand . " 2>&1");

    // Check for compilation errors
    if (strpos($compileOutput, "error") === false) {
        // Execute the compiled executable
        $executeCommand = escapeshellarg(__DIR__ . "\\" . $outputExe);
        $output = shell_exec($executeCommand . " 2>&1");
        echo $output;
    } else {
        // Output compilation errors
        echo "Compilation Error: \n" . $compileOutput;
    }

    // Optional: Clean up the executable file after execution
    if (file_exists(__DIR__ . "\\" . $outputExe)) {
        unlink(__DIR__ . "\\" . $outputExe);
    }
}
if ($language == "java") {
    $output = shell_exec("D:\java_compiler\jdk-23.0.1\bin\javac.exe $filePath 2>&1");
    echo $output;
}

