pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/sakshiprasad07/Capstone-.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }

        stage('Run Backend') {
            steps {
                dir('backend') {
                    bat 'echo Backend setup complete'
                }
            }
        }
    }
}