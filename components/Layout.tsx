"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title = 'Jogos Clássicos' }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title} - Jogos Clássicos</title>
      </Head>
      
      <AppBar position="static" className="bg-gradient-to-r from-purple-900 to-indigo-900">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          
          <Link href="/" passHref>
            <Button color="inherit" startIcon={<Home />}>
              Início
            </Button>
          </Link>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" className="pt-8 pb-16">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 transition duration-200">
            <ArrowBack className="mr-2" fontSize="small" />
            <span>Voltar para o início</span>
          </Link>
        </div>
        
        <Box component="main">
          {children}
        </Box>
      </Container>
      
      <footer className="bg-gray-900 text-white p-6">
        <Container maxWidth="lg">
          <div className="flex flex-col md:flex-row justify-between">
            <Typography variant="body2" color="inherit">
              © {new Date().getFullYear()} Jogos Clássicos
            </Typography>
            <div className="mt-4 md:mt-0">
              <Typography variant="body2" color="inherit">
                Desenvolvido com Next.js e Material UI
              </Typography>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Layout; 