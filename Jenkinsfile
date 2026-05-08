pipeline {
    agent any

    environment {
        EMAIL = "qanatabbas14@gmail.com"
        TEST_IMAGE = "compulysis-test-runner:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
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
                    echo "Waiting for backend on http://localhost:8003/health"

                    for i in $(seq 1 40); do
                        curl -fsS http://localhost:8003/health && echo "Backend ready" && exit 0
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
                    echo "Waiting for frontend on 8004..."

                    for i in $(seq 1 20); do
                        curl -fsS http://localhost:8004 && echo "Frontend ready" && exit 0
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
                        -e BASE_URL=http://localhost:8004 \
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
                to: "${EMAIL}",
                subject: "SUCCESS: Compulysis Selenium Tests",
                body: "All tests passed successfully! ✅"
            )
        }

        failure {
            emailext(
                to: "${EMAIL}",
                subject: "FAILED: Compulysis Selenium Tests",
                body: "Tests failed ❌ Check Jenkins logs."
            )
        }
    }
}
