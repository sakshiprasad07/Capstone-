pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Stop Old Containers') {
            steps {
                bat 'docker-compose down --remove-orphans'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker-compose build'
            }
        }

        stage('Deploy Updated Containers') {
            steps {
                bat 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution completed.'
        }
        success {
            echo 'CI/CD executed successfully.'
        }
        failure {
            echo 'Build failed.'
        }
    }
}