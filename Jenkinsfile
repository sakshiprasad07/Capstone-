pipeline {
    agent any

    stages {

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