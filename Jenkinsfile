pipeline {
    agent any

    environment {
        TEST_IMAGE = "compulysis-test-runner:latest"
        COMMIT_EMAIL = ""
        DEFAULT_EMAIL = "qanatabbas14@gmail.com"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Get Commit Author Email') {
            steps {
                script {
                    def email = sh(
                        script: "git log -1 --pretty=format:'%ae'",
                        returnStdout: true
                    ).trim()

                    if (email == "") {
                        email = "${env.DEFAULT_EMAIL}"
                    }

                    env.COMMIT_EMAIL = email
                    echo "Notification will be sent to: ${env.COMMIT_EMAIL}"
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
                    echo "Waiting for frontend on 8089..."

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
            emailext(
                to: "${env.COMMIT_EMAIL}",
                subject: "SUCCESS: Compulysis Selenium Tests",
                body: "All tests passed successfully! ✅\nCommit verified pipeline execution completed."
            )
        }

        failure {
            emailext(
                to: "${env.COMMIT_EMAIL}",
                subject: "FAILED: Compulysis Selenium Tests",
                body: "Tests failed ❌ Please check Jenkins logs for details."
            )
        }
    }
}
