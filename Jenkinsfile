pipeline {
    agent any

    environment {
        EMAIL = "qanatabbas14@gmail.com"
        TEST_IMAGE = "qanatabbas/compulysis-test-runner:latest"
    }

    stages {

        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ─────────────────────────────────────────────
        stage('Setup Environment (Docker Compose)') {
            steps {
                sh '''
                    docker compose down --remove-orphans || true
                    docker compose pull || true
                    docker compose up -d --remove-orphans
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Wait for Services') {
            steps {
                sh '''
                    echo "Waiting for backend..."
                    for i in $(seq 1 36); do
                        curl -fsS http://localhost:8003/health && break || sleep 5
                    done

                    echo "Waiting for frontend..."
                    for i in $(seq 1 12); do
                        curl -fsS http://localhost:8004 && break || sleep 5
                    done
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Build Test Image') {
            steps {
                sh '''
                    echo "Building Selenium Test Image..."
                    docker build -t ${TEST_IMAGE} -f Dockerfile.test .
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    docker run --rm \
                        --add-host=host.docker.internal:host-gateway \
                        -v "${WORKSPACE}/selenium_tests:/app" \
                        --shm-size=1g \
                        -w /app \
                        -e BASE_URL=http://host.docker.internal:8004 \
                        ${TEST_IMAGE} \
                        bash -c "
                            mkdir -p reports
                            python -m unittest test_suite.py 2>&1 | tee reports/test_output.txt
                        "
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'selenium_tests/reports/**'
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    post {
        always {
            script {

                def report = fileExists("selenium_tests/reports/test_output.txt") ?
                             readFile("selenium_tests/reports/test_output.txt") :
                             "No test output found"

                emailext(
                    to: "${EMAIL}",
                    subject: "Compulysis CI Build #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
                    mimeType: "text/html",
                    body: """
                        <h2>Compulysis DevOps Selenium Test Report</h2>
                        <p><b>Status:</b> ${currentBuild.currentResult}</p>
                        <pre style="background:#f4f4f4;padding:10px;">${report}</pre>
                        <p>Build URL: ${env.BUILD_URL}</p>
                    """
                )

                sh "docker compose down --remove-orphans || true"
            }
        }
    }
}
