pipeline {
    agent any

    environment {
        TEST_IMAGE = "compulysis-test-runner:latest"
        DEFAULT_EMAIL = "qanatabbas14@gmail.com"
        EMAIL_TO = ""
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Detect Committer Email') {
            steps {
                script {
                    def emailFromGit = sh(
                        script: "git log -1 --pretty=format:'%ae'",
                        returnStdout: true
                    ).trim()

                    echo "Detected committer email: ${emailFromGit}"

                    if (emailFromGit == null || emailFromGit == "" || emailFromGit == "null") {
                        EMAIL_TO = DEFAULT_EMAIL
                    } else {
                        EMAIL_TO = emailFromGit
                    }

                    env.EMAIL_TO = EMAIL_TO
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
                to: "${env.EMAIL_TO}",
                subject: "SUCCESS: Compulysis Selenium Tests",
                body: "All tests passed successfully ✅\nCommitter: ${env.EMAIL_TO}"
            )
        }

        failure {
            emailext(
                to: "${env.EMAIL_TO}",
                subject: "FAILED: Compulysis Selenium Tests",
                body: "Tests failed ❌\nCheck Jenkins logs.\nCommitter: ${env.EMAIL_TO}"
            )
        }
    }
}
