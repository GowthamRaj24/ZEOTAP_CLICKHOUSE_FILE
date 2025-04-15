import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaDatabase, FaCloudUploadAlt, FaFileExport, FaColumns, FaChartLine, FaShieldAlt } from 'react-icons/fa'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

function Home() {
  return (
    <div className="pb-20">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            className="md:w-1/2 mb-12 md:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Bidirectional Data Flow
              </span>
              <br /> 
              Made Seamless
            </h1>
            
            <p className="text-lg md:text-xl text-secondary-600 mb-8 max-w-lg">
              Transfer data between ClickHouse and flat files with enterprise-grade reliability, speed, and security.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/clickhouse-to-file" 
                className="btn btn-primary py-3 px-8 text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1"
              >
                <FaFileExport className="mr-2" />
                Export Data
              </Link>
              <Link 
                to="/file-to-clickhouse" 
                className="btn btn-secondary py-3 px-8 text-lg shadow-md hover:shadow-lg transform transition hover:-translate-y-1"
              >
                <FaCloudUploadAlt className="mr-2" />
                Import Data
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl transform rotate-3 scale-105 opacity-20"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-2xl border border-secondary-200">
                <div className="flex items-center mb-6">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-secondary-500 text-sm font-mono">ClickHouse Data Flow</div>
                </div>
                
                <div className="space-y-4">
                  <DataFlowAnimation />
                  
                  <div className="h-24 bg-secondary-50 rounded-lg border border-secondary-200 flex items-center justify-center p-4 overflow-hidden">
                    <CodeAnimation />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function DataFlowAnimation() {
  return (
    <div className="h-48 bg-secondary-900 rounded-lg p-4 overflow-hidden relative">
      <div className="flex justify-between mb-4">
        <div className="flex items-center">
          <FaDatabase className="text-primary-400 mr-2" />
          <span className="text-white text-sm font-mono">ClickHouse</span>
        </div>
        <div className="text-secondary-400 text-xs">Connected</div>
      </div>
      
      <div className="flex space-x-2 justify-center">
        <div className="animate-dataflow">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="h-2 w-12 rounded-full mb-2 opacity-80"
              style={{ 
                backgroundColor: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#10b981' : '#f59e0b',
                animationDelay: `${i * 0.2}s` 
              }}
            ></div>
          ))}
        </div>
        
        <div className="animate-dataflow-reverse">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="h-2 w-8 rounded-full mb-2 opacity-80"
              style={{ 
                backgroundColor: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#f59e0b' : '#6366f1',
                animationDelay: `${i * 0.15}s` 
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CodeAnimation() {
  return (
    <div className="font-mono text-xs text-secondary-700 w-full h-full animate-scrollCode">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="flex">
          <span className="text-secondary-400 mr-2">{i+1}</span>
          <span className="text-primary-500">SELECT</span>
          <span className="mx-1">*</span>
          <span className="text-primary-500">FROM</span>
          <span className="mx-1 text-accent-600">metrics</span>
          <span className="text-primary-500">WHERE</span>
          <span className="mx-1 text-secondary-700">date</span>
          <span>&gt;</span>
          <span className="mx-1 text-secondary-500">'2023-01-01'</span>
        </div>
      ))}
    </div>
  )
}

function FeaturesSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true,
  })
  
  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])
  
  const featuresVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }
  
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }
  
  const features = [
    {
      icon: <FaCloudUploadAlt className="text-primary-500 text-4xl" />,
      title: "Bidirectional Transfer",
      description: "Move data effortlessly between ClickHouse and flat files in either direction."
    },
    {
      icon: <FaColumns className="text-primary-500 text-4xl" />,
      title: "Column Selection",
      description: "Choose specific columns for ingestion to optimize data transfer."
    },
    {
      icon: <FaShieldAlt className="text-primary-500 text-4xl" />,
      title: "JWT Authentication",
      description: "Secure your connections with token-based authentication support."
    },
    {
      icon: <FaChartLine className="text-primary-500 text-4xl" />,
      title: "Progress Tracking",
      description: "Monitor data processing with real-time progress reporting."
    }
  ]
  
  return (
    <section className="py-20 bg-white relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary-50 opacity-50"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="relative">
              Powerful Features
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></span>
            </span>
          </h2>
          <p className="text-secondary-600 text-lg max-w-2xl mx-auto">
            Our connector delivers enterprise-grade capabilities for seamless data integration.
          </p>
        </div>
        
        <motion.div 
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={featuresVariants}
          initial="hidden"
          animate={controls}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-secondary-200 transition-all duration-300 transform hover:-translate-y-1"
              variants={featureVariants}
            >
              <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-secondary-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function StatsSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true,
  })
  
  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])
  
  const statsVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }
  
  const statVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }
  
  const stats = [
    { value: "99.9%", label: "Reliability" },
    { value: "50M+", label: "Records Per Minute" },
    { value: "100%", label: "Column Selection" }
  ]
  
  return (
    <section className="py-16 bg-gradient-to-br from-primary-900 to-primary-800 text-white">
      <div className="container mx-auto px-4">
        <motion.div 
          ref={ref}
          className="flex flex-col md:flex-row justify-around items-center gap-8"
          variants={statsVariants}
          initial="hidden"
          animate={controls}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center"
              variants={statVariants}
            >
              <div className="inline-block mb-4 relative">
                <span className="text-5xl md:text-6xl font-display font-bold">{stat.value}</span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-accent-400 rounded-full"></div>
              </div>
              <p className="text-primary-100 text-lg">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative p-12 md:p-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10 transform translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                Ready to streamline your data ingestion?
              </h2>
              
              <p className="text-primary-100 text-lg mb-8">
                Start transferring data between ClickHouse and flat files with just a few clicks. Experience the most efficient data connector available.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link 
                  to="/clickhouse-to-file" 
                  className="btn bg-white text-primary-700 hover:bg-primary-50 py-3 px-8 text-lg shadow-lg"
                >
                  <FaFileExport className="mr-2" />
                  Export Data
                </Link>
                <Link 
                  to="/file-to-clickhouse" 
                  className="btn bg-primary-700 text-white hover:bg-primary-800 py-3 px-8 text-lg shadow-lg border border-primary-500"
                >
                  <FaCloudUploadAlt className="mr-2" />
                  Import Data
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home 