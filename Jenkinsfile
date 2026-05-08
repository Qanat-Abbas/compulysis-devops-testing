pipeline {
    agent any

    environment {
        TEST_IMAGE = "compulysis-test-runner:latest"
        FALLBACK_EMAIL = "qanatabbas14@gmail.com"
        EMAIL_TO = ""
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git fetch --unshallow || true'
            }
        }

        stage('Detect Committer Email') {
            steps {
                script {
                    def emailFromGit = sh(
                        script: "git log -1 --pretty=format:%ae || echo ''",
                        returnStdout: true
                    ).trim()

                    echo "Detected git email: '${emailFromGit}'"

                    if (!emailFromGit?.trim() || emailFromGit == "null") {
                        env.EMAIL_TO = env.FALLBACK_EMAIL
                        echo "Using fallback email: ${env.EMAIL_TO}"
                    } else {
                        env.EMAIL_TO = emailFromGit
                        echo "Using committer email: ${env.EMAIL_TO}"
                    }
                }
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
                        curl -fsS http://localhost:8088/health && echo "Backend ready" && exit 0
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
                        curl -fsS http://localhost:8089 && echo "Frontend ready" && exit 0
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
            sh "docker compose down --remove-orphans || true"
        }

        success {
            script {
                def recipient = env.EMAIL_TO?.trim()
                if (!recipient) {
                    recipient = env.FALLBACK_EMAIL
                }

                emailext(
                    to: recipient,
                    subject: "SUCCESS: Compulysis Selenium Tests",
                    body: """
All tests passed successfully ✅

Build: #${env.BUILD_NUMBER}
Committer: ${recipient}
Jenkins URL: ${env.BUILD_URL}
"""
                )
            }
        }

        failure {
            script {
                def recipient = env.EMAIL_TO?.trim()
                if (!recipient) {
                    recipient = env.FALLBACK_EMAIL
                }

                emailext(
                    to: recipient,
                    subject: "FAILED: Compulysis Selenium Tests",
                    body: """
Tests failed ❌

Build: #${env.BUILD_NUMBER}
Committer: ${recipient}
Check Jenkins logs: ${env.BUILD_URL}
"""
                )
            }
        }
    }
}
