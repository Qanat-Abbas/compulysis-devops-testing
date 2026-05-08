// =============================================================================
// Jenkinsfile — Compulysis CI Pipeline
//
// Python-based Selenium test flow:
//   1. Build a dedicated Python + Chrome + ChromeDriver test image from tests/Dockerfile.
//   2. Start the app stack with docker compose.
//   3. Run pytest inside the container and emit JUnit XML for Jenkins.
//   4. Publish the pytest report and email the committer with a summary.
// =============================================================================

pipeline {
    agent any

    environment {
        // Pre-built image from Docker Hub
        TEST_IMAGE = "zaibjahan200/compulysis-test-runner:latest"

        // Fallback recipient if git log cannot find the committer.
        FALLBACK_EMAIL = "jahanzaibparacha.32@gmail.com"  // ← change this to your team email
    }

    stages {



        // ── Stage 2: Start the application ────────────────────────────────────
        stage('Build') {
            steps {
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose pull || true'
                sh 'docker compose up -d --remove-orphans'
            }
        }

        // ── Stage 3: Wait for health + run Selenium tests ─────────────────────
        stage('Test') {
            steps {
                sh '''
                    set -e

                    # ── Wait for backend health endpoint ──────────────────────
                    echo "Waiting for backend at http://localhost:8003/health ..."
                    ready=false
                    for attempt in $(seq 1 36); do
                        if curl -fsS "http://localhost:8003/health" >/dev/null 2>&1; then
                            ready=true
                            break
                        fi
                        echo "  attempt ${attempt}/36 — sleeping 5s"
                        sleep 5
                    done
                    if [ "${ready}" != "true" ]; then
                        echo "ERROR: Backend did not become healthy within 3 minutes."
                        docker compose logs backend
                        exit 1
                    fi
                    echo "Backend is healthy."

                    # ── Wait for frontend ─────────────────────────────────────
                    echo "Waiting for frontend at http://localhost:8004 ..."
                    ready=false
                    for attempt in $(seq 1 12); do
                        if curl -fsS "http://localhost:8004" >/dev/null 2>&1; then
                            ready=true
                            break
                        fi
                        echo "  attempt ${attempt}/12 — sleeping 5s"
                        sleep 5
                    done
                    if [ "${ready}" != "true" ]; then
                        echo "ERROR: Frontend did not become available within 1 minute."
                        docker compose logs frontend
                        exit 1
                    fi
                    echo "Frontend is available."

                    # ── Run Python Selenium tests ──────────────────────────────
                    docker run --rm \
                        --add-host=host.docker.internal:host-gateway \
                        -v "${WORKSPACE}/selenium_tests:/workspace" \
                        --shm-size=1g \
                        -w /workspace \
                        -e BASE_URL=http://host.docker.internal:8004 \
                        -e BACKEND_HEALTH_URL=http://host.docker.internal:8003/health \
                        -e CHROME_BINARY=/usr/bin/google-chrome \
                        -e CHROMEDRIVER_PATH=/usr/local/bin/chromedriver \
                        ${TEST_IMAGE} \
                        bash -c "mkdir -p reports && chmod 777 reports && python test_suite.py > reports/test_output.txt 2>&1; EXIT_CODE=\$?; chmod 777 reports/test_output.txt || true; exit \$EXIT_CODE"
                '''
            }
        }

    } // end stages

    post {
        always {
            script {
                // ── Set safe.directory so git commands work in Jenkins workspace ──
                sh "git config --global --add safe.directory '${env.WORKSPACE}' || true"

                // ── Determine recipient email ──────────────────────────────────
                def committer = ""
                try {
                    committer = sh(
                        script: "git log -1 --pretty=format:%ae 2>/dev/null || true",
                        returnStdout: true
                    ).trim()
                } catch (Exception e) {
                    echo "WARNING: Could not read committer email — ${e.message}"
                }

                // Fall back to env var or hard-coded address rather than crashing.
                if (!committer) {
                    committer = env.FALLBACK_EMAIL ?: "devops@example.com"
                    echo "Using fallback recipient: ${committer}"
                }

                // ── Read text report ──────────────────────────────────────────
                def reportPath = 'selenium_tests/reports/test_output.txt'
                def logContent = "No test output found. The test run may have failed before tests executed."
                
                if (fileExists(reportPath)) {
                    logContent = readFile(reportPath)
                }

                def emailBody = """
<html>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#111827;line-height:1.6;">
<div style="max-width:900px;margin:0 auto;padding:24px;">
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:28px;">

  <h2 style="margin:0 0 8px;color:#0f172a;">Compulysis — Selenium Test Report</h2>
  <p style="margin:0 0 20px;color:#475569;">
    Build <strong>#${env.BUILD_NUMBER}</strong> &nbsp;|&nbsp;
    Status: <strong>${currentBuild.currentResult}</strong>
  </p>

  <h3 style="margin:0 0 12px;color:#0f172a;">Console Output</h3>
  <div style="background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;font-family:monospace;white-space:pre-wrap;font-size:13px;overflow-x:auto;">${logContent}</div>

  <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">
        Jenkins URL: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a><br/>
        Python + Chrome + ChromeDriver + Selenium
  </p>

</div>
</div>
</body>
</html>
""".stripIndent().trim()

                // ── Send email ─────────────────────────────────────────────────
                try {
                    emailext(
                        to:       committer,
                        subject:  "Compulysis Build #${env.BUILD_NUMBER} — ${currentBuild.currentResult}",
                        mimeType: 'text/html',
                        body:     emailBody
                    )
                    echo "Test report email sent to: ${committer}"
                } catch (Exception mailEx) {
                    echo "WARNING: Failed to send email — ${mailEx.message}"
                    echo "Check that the Email Extension plugin is installed and SMTP is configured in Jenkins."
                }

            } // end script
        } // end always



    } // end post

} // end pipeline