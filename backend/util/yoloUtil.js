const { spawn } = require('child_process');
const path = require('path');

/**
 * detectImage
 * - imagePath: absolute or project-relative path to image file
 * - returns Promise resolving to string (human-readable result) or throws error
 */
exports.detectImage = (imagePath) => {
  return new Promise((resolve, reject) => {
    try {
  // prefer the new centralized script at backend/AI/run_detection.py
  const scriptPath = path.resolve(__dirname, '../AI/run_detection.py');
      const args = [scriptPath, imagePath];
      // Use py -3 on Windows; fallback to python
      const cmd = process.platform === 'win32' ? 'py' : 'python3';
      const py = spawn(cmd, args);

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        }

        // Expecting JSON or plain text; try to parse JSON first
        try {
          // stdout may include logging lines before the JSON payload (Ultralytics prints).
          // Try to extract a JSON substring starting at the first '{' or '['.
          let parsed = null;
          const firstBrace = stdout.indexOf('{');
          const firstBracket = stdout.indexOf('[');
          let jsonCandidate = null;
          if (firstBrace !== -1) jsonCandidate = stdout.slice(firstBrace);
          else if (firstBracket !== -1) jsonCandidate = stdout.slice(firstBracket);
          if (jsonCandidate) {
            try {
              parsed = JSON.parse(jsonCandidate);
            } catch (e) {
              // fallthrough to try parsing entire stdout
            }
          }
          if (!parsed) {
            parsed = JSON.parse(stdout);
          }
          // Create human readable summary
          if (!parsed || !Array.isArray(parsed.detections)) {
            return resolve(JSON.stringify(parsed));
          }
          if (parsed.detections.length === 0) return resolve('검출 결과 없음');

          const lines = parsed.detections.map((d) => {
            return `${d.label} (${(d.confidence * 100).toFixed(1)}%)`;
          });
          return resolve(lines.join(', '));
        } catch (e) {
          // not JSON, return raw
          return resolve(stdout.trim() || stderr.trim());
        }
      });
    } catch (err) {
      return reject(err);
    }
  });
};
