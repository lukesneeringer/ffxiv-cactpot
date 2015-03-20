# -*- mode: ruby -*-
# vi: set ft=ruby :

# Where is this file located?
require 'pathname'
whereami = File.dirname(Pathname.new(__FILE__).realpath)


# Proceed with vagrant configuration.
Vagrant.require_version '>= 1.5.1'

Vagrant.configure('2') do |config|
  config.vm.define 'trusty', primary: true do |trusty|
    trusty.vm.box = 'ubuntu/trusty64'

    trusty.vm.synced_folder '.', '/var/www/ffxiv-cactpot/'

    trusty.vm.hostname = 'cactpot'
    trusty.vm.network :private_network, ip: '33.33.33.12'
    trusty.vm.network :forwarded_port, guest: 80, host: 8012

    trusty.vm.provider :virtualbox do |vb|
      vb.customize ["modifyvm", :id, "--memory", '2048']
    end
  end

  config.ssh.forward_agent = true

  config.vm.provision 'ansible' do |ansible|
    ansible.extra_vars = {
      'ansible_sudo' => true,
      'development' => true,
      'target_hosts' => 'vagrant',
      'target_user' => 'vagrant',
      'vagrant' => true,
      'vagrant_host_user' => ENV['USER'],
    }
    ansible.playbook = whereami + '/provisioning/playbook.yml'
    ansible.verbose = 'v'
  end
end
