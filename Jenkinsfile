```groovy
// =============================================================================
// Jenkinsfile — Compulysis CI Pipeline
//
// Flow:
//   1. Checkout repository
//   2. Start Docker services
//   3. Wait for backend/frontend health
//   4. Build Selenium test image
//   5. Run Selenium tests and save logs
//   6. Email test report to latest committer
// =============================================================================

pipeline {
    agent any

    environment {
        TEST_IMAGE = "compulysis-test-runner:latest"
        FALLBACK_EMAIL = "qanatabbas14@gmail.com"
    }

    stages {

        // ─────────────────────────────────────────────────────────────
        // Checkout Repository
        // ─────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    git fetch --unshallow || true
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Start Docker Services
        // ─────────────────────────────────────────────────────────────
        stage('Start Services') {
            steps {
                sh '''
                    docker compose down --remove-orphans || true
                    docker compose pull || true
                    docker compose up -d --remove-orphans
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Wait for Backend
        // ─────────────────────────────────────────────────────────────
        stage('Wait for Backend') {
            steps {
                sh '''
                    echo "Waiting for backend on http://localhost:8088/health"

                    ready=false

                    for i in $(seq 1 40); do
                        if curl -fsS http://localhost:8088/health > /dev/null 2>&1; then
                            ready=true
                            break
                        fi

                        echo "Attempt ${i}/40 ..."
                        sleep 5
                    done

                    if [ "$ready" != "true" ]; then
                        echo "Backend failed to start"
                        docker logs compulysis-backend-jenkins
                        exit 1
                    fi

                    echo "Backend ready"
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Wait for Frontend
        // ─────────────────────────────────────────────────────────────
        stage('Wait for Frontend') {
            steps {
                sh '''
                    echo "Waiting for frontend on http://localhost:8089"

                    ready=false

                    for i in $(seq 1 20); do
                        if curl -fsS http://localhost:8089 > /dev/null 2>&1; then
                            ready=true
                            break
                        fi

                        echo "Attempt ${i}/20 ..."
                        sleep 5
                    done

                    if [ "$ready" != "true" ]; then
                        echo "Frontend failed to start"
                        docker logs compulysis-frontend-jenkins
                        exit 1
                    fi

                    echo "Frontend ready"
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Build Selenium Test Image
        // ─────────────────────────────────────────────────────────────
        stage('Build Test Image') {
            steps {
                sh '''
                    docker build -t ${TEST_IMAGE} -f Dockerfile.test .
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Run Selenium Tests
        // ─────────────────────────────────────────────────────────────
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    mkdir -p test-reports

                    docker run --rm \
                        --network host \
                        -v "${WORKSPACE}/test-reports:/app/test-reports" \
                        -e BASE_URL=http://localhost:8089 \
                        ${TEST_IMAGE} \
                        sh -c "pytest -v > /app/test-reports/test_output.txt 2>&1"
                '''
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // POST ACTIONS
    // ─────────────────────────────────────────────────────────────────
    post {

        always {

            script {

                // Cleanup containers
                sh '''
                    docker compose down --remove-orphans || true
                '''

                // Fix Jenkins Git safe directory issue
                sh "git config --global --add safe.directory '${env.WORKSPACE}' || true"

                // ─────────────────────────────────────────────
                // Detect Committer Email
                // ─────────────────────────────────────────────
                def committer = ""

                try {
                    committer = sh(
                        script: "git log -1 --pretty=format:%ae",
                        returnStdout: true
                    ).trim()

                    echo "Detected committer email: ${committer}"

                } catch (Exception e) {

                    echo "Could not detect committer email"
                }

                // Fallback email
                if (!committer || committer == "null") {
                    committer = env.FALLBACK_EMAIL
                    echo "Using fallback email: ${committer}"
                }

                // ─────────────────────────────────────────────
                // Read Selenium Test Output
                // ─────────────────────────────────────────────
                def reportPath = "test-reports/test_output.txt"

                def logContent = "No Selenium output found."

                if (fileExists(reportPath)) {
                    logContent = readFile(reportPath)
                }

                // Build status
                def buildStatus = currentBuild.currentResult

                // ─────────────────────────────────────────────
                // Email HTML Body
                // ─────────────────────────────────────────────
                def emailBody = """
<html>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#111827;line-height:1.6;">

<div style="max-width:900px;margin:0 auto;padding:24px;">

<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:28px;">

<h2 style="margin:0 0 10px;color:#0f172a;">
Compulysis Selenium Test Report
</h2>

<p>
<strong>Build:</strong> #${env.BUILD_NUMBER}<br/>
<strong>Status:</strong> ${buildStatus}<br/>
<strong>Committer:</strong> ${committer}
</p>

<h3>Test Execution Output</h3>

<div style="
    background:#1e1e1e;
    color:#d4d4d4;
    padding:16px;
    border-radius:8px;
    font-family:monospace;
    white-space:pre-wrap;
    overflow-x:auto;
    font-size:13px;
">
${logContent}
</div>

<p style="margin-top:20px;">
<strong>Jenkins URL:</strong><br/>
<a href="${env.BUILD_URL}">
${env.BUILD_URL}
</a>
</p>

</div>
</div>

</body>
</html>
"""

                // ─────────────────────────────────────────────
                // Send Email
                // ─────────────────────────────────────────────
                emailext(
                    to: committer,
                    subject: "Compulysis Build #${env.BUILD_NUMBER} — ${buildStatus}",
                    mimeType: 'text/html',
                    body: emailBody
                )

                echo "Email sent to: ${committer}"
            }
        }
    }
}
```
