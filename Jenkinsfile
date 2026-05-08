pipeline {
    agent any

    environment {
        TEST_IMAGE = "compulysis-test-runner:latest"
        FALLBACK_EMAIL = "qanatabbas14@gmail.com"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    git fetch --unshallow || true
                '''
            }
        }

        stage('Start Services') {
            steps {
                sh '''
                    docker compose down --remove-orphans || true
                    docker compose pull || true
                    docker compose up -d --remove-orphans
                '''
            }
        }

        stage('Wait for Backend') {
            steps {
                sh '''
                    echo "Waiting for backend on http://localhost:8088/health"

                    for i in $(seq 1 40); do
                        if curl -fsS http://localhost:8088/health > /dev/null; then
                            echo "Backend ready"
                            exit 0
                        fi

                        sleep 5
                    done

                    echo "Backend failed to start"
                    docker logs compulysis-backend-jenkins
                    exit 1
                '''
            }
        }

        stage('Wait for Frontend') {
            steps {
                sh '''
                    echo "Waiting for frontend on http://localhost:8089"

                    for i in $(seq 1 20); do
                        if curl -fsS http://localhost:8089 > /dev/null; then
                            echo "Frontend ready"
                            exit 0
                        fi

                        sleep 5
                    done

                    echo "Frontend failed to start"
                    docker logs compulysis-frontend-jenkins
                    exit 1
                '''
            }
        }

        stage('Build Test Image') {
            steps {
                sh '''
                    docker build -t ${TEST_IMAGE} -f Dockerfile.test .
                '''
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh '''
                    docker run --rm \
                        --network host \
                        -e BASE_URL=http://localhost:8089 \
                        ${TEST_IMAGE}
                '''
            }
        }
    }

    post {

        always {

            script {

                sh '''
                    docker compose down --remove-orphans || true
                '''

                // Fix Jenkins git ownership issue
                sh "git config --global --add safe.directory '${env.WORKSPACE}' || true"

                // Detect committer email
                def committer = sh(
                    script: "git log -1 --pretty=format:%ae",
                    returnStdout: true
                ).trim()

                echo "Detected committer email: ${committer}"

                // Fallback if empty
                if (!committer || committer == "null") {
                    committer = env.FALLBACK_EMAIL
                    echo "Using fallback email: ${committer}"
                }

                // Determine build status
                def buildStatus = currentBuild.currentResult

                // Send email
                emailext(
                    to: committer,
                    subject: "${buildStatus}: Compulysis Selenium Tests",
                    body: """
Build Status: ${buildStatus}

Build Number: #${env.BUILD_NUMBER}

Recipient: ${committer}

Jenkins URL:
${env.BUILD_URL}
"""
                )

                echo "Email sent to: ${committer}"
            }
        }
    }
}
